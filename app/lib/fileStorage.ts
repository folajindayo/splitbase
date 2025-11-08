import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface UploadOptions {
  bucket?: string;
  path?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  makePublic?: boolean;
  cacheControl?: string;
  onProgress?: (progress: number) => void;
  metadata?: Record<string, string>;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  publicUrl?: string;
  path: string;
  bucket: string;
  uploadedBy?: string;
  uploadedAt: string;
  metadata?: Record<string, string>;
  checksum?: string;
}

export interface UploadResult {
  success: boolean;
  file?: FileMetadata;
  error?: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<string, { count: number; size: number }>;
  recentUploads: FileMetadata[];
}

class FileStorageSystem {
  private static instance: FileStorageSystem;
  private readonly DEFAULT_BUCKET = 'uploads';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  private constructor() {}

  static getInstance(): FileStorageSystem {
    if (!FileStorageSystem.instance) {
      FileStorageSystem.instance = new FileStorageSystem();
    }
    return FileStorageSystem.instance;
  }

  // Upload a file
  async upload(
    file: File | Blob,
    userId: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Validate file size
      const maxSize = options.maxSize || this.MAX_FILE_SIZE;
      if (file.size > maxSize) {
        return {
          success: false,
          error: `File size exceeds maximum allowed size of ${this.formatFileSize(maxSize)}`,
        };
      }

      // Validate file type
      const allowedTypes = options.allowedTypes || this.ALLOWED_TYPES;
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: `File type ${file.type} is not allowed`,
        };
      }

      // Generate unique file path
      const bucket = options.bucket || this.DEFAULT_BUCKET;
      const timestamp = Date.now();
      const fileName = file instanceof File ? file.name : 'file';
      const sanitizedName = this.sanitizeFileName(fileName);
      const path = options.path
        ? `${options.path}/${timestamp}-${sanitizedName}`
        : `${userId}/${timestamp}-${sanitizedName}`;

      // Calculate checksum
      const checksum = await this.calculateChecksum(file);

      // Upload to storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: options.cacheControl || '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Get public URL if needed
      let publicUrl: string | undefined;
      if (options.makePublic) {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);
        publicUrl = urlData.publicUrl;
      }

      // Get signed URL (valid for 1 year)
      const { data: signedData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 31536000);

      // Save metadata to database
      const fileMetadata: Omit<FileMetadata, 'id'> = {
        name: sanitizedName,
        size: file.size,
        type: file.type,
        url: signedData?.signedUrl || '',
        publicUrl,
        path,
        bucket,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        metadata: options.metadata,
        checksum,
      };

      const { data: metadataRecord, error: metadataError } = await supabase
        .from('file_metadata')
        .insert(fileMetadata)
        .select()
        .single();

      if (metadataError) {
        // Cleanup uploaded file if metadata save fails
        await this.delete(bucket, path);
        return {
          success: false,
          error: 'Failed to save file metadata',
        };
      }

      return {
        success: true,
        file: metadataRecord,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload file',
      };
    }
  }

  // Upload multiple files
  async uploadMultiple(
    files: Array<File | Blob>,
    userId: string,
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.upload(file, userId, options);
      results.push(result);
    }

    return results;
  }

  // Download a file
  async download(bucket: string, path: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error('Download error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }

  // Delete a file
  async delete(bucket: string, path: string): Promise<boolean> {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        return false;
      }

      // Delete metadata
      const { error: metadataError } = await supabase
        .from('file_metadata')
        .delete()
        .eq('bucket', bucket)
        .eq('path', path);

      if (metadataError) {
        console.error('Metadata deletion error:', metadataError);
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  // Delete multiple files
  async deleteMultiple(files: Array<{ bucket: string; path: string }>): Promise<boolean> {
    try {
      const deletionPromises = files.map(file => this.delete(file.bucket, file.path));
      const results = await Promise.all(deletionPromises);
      return results.every(result => result);
    } catch (error) {
      console.error('Multiple delete error:', error);
      return false;
    }
  }

  // Get file metadata
  async getMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('file_metadata')
        .select('*')
        .eq('id', fileId)
        .single();

      if (error) {
        console.error('Get metadata error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get metadata error:', error);
      return null;
    }
  }

  // List files for a user
  async listFiles(
    userId: string,
    options: {
      bucket?: string;
      limit?: number;
      offset?: number;
      sortBy?: 'name' | 'size' | 'uploadedAt';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<FileMetadata[]> {
    try {
      let query = supabase
        .from('file_metadata')
        .select('*')
        .eq('uploaded_by', userId);

      if (options.bucket) {
        query = query.eq('bucket', options.bucket);
      }

      const sortBy = options.sortBy || 'uploadedAt';
      const sortOrder = options.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('List files error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  }

  // Search files
  async searchFiles(
    userId: string,
    query: string,
    options: {
      bucket?: string;
      fileTypes?: string[];
    } = {}
  ): Promise<FileMetadata[]> {
    try {
      let dbQuery = supabase
        .from('file_metadata')
        .select('*')
        .eq('uploaded_by', userId)
        .ilike('name', `%${query}%`);

      if (options.bucket) {
        dbQuery = dbQuery.eq('bucket', options.bucket);
      }

      if (options.fileTypes && options.fileTypes.length > 0) {
        dbQuery = dbQuery.in('type', options.fileTypes);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Search files error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Search files error:', error);
      return [];
    }
  }

  // Get storage statistics
  async getStats(userId: string): Promise<StorageStats> {
    try {
      const { data, error } = await supabase
        .from('file_metadata')
        .select('*')
        .eq('uploaded_by', userId);

      if (error) {
        console.error('Get stats error:', error);
        return {
          totalFiles: 0,
          totalSize: 0,
          byType: {},
          recentUploads: [],
        };
      }

      const stats: StorageStats = {
        totalFiles: data?.length || 0,
        totalSize: 0,
        byType: {},
        recentUploads: [],
      };

      if (data) {
        // Calculate total size
        stats.totalSize = data.reduce((sum, file) => sum + file.size, 0);

        // Group by type
        data.forEach(file => {
          if (!stats.byType[file.type]) {
            stats.byType[file.type] = { count: 0, size: 0 };
          }
          stats.byType[file.type].count++;
          stats.byType[file.type].size += file.size;
        });

        // Get recent uploads (last 10)
        stats.recentUploads = data
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          .slice(0, 10);
      }

      return stats;
    } catch (error) {
      console.error('Get stats error:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        byType: {},
        recentUploads: [],
      };
    }
  }

  // Create a signed URL for temporary access
  async createSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Create signed URL error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Create signed URL error:', error);
      return null;
    }
  }

  // Move a file to a different path
  async move(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .move(fromPath, toPath);

      if (error) {
        console.error('Move error:', error);
        return false;
      }

      // Update metadata
      const { error: updateError } = await supabase
        .from('file_metadata')
        .update({ path: toPath })
        .eq('bucket', bucket)
        .eq('path', fromPath);

      if (updateError) {
        console.error('Metadata update error:', updateError);
      }

      return true;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  }

  // Copy a file
  async copy(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .copy(fromPath, toPath);

      if (error) {
        console.error('Copy error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Copy error:', error);
      return false;
    }
  }

  // Helpers
  private sanitizeFileName(fileName: string): string {
    // Remove special characters and spaces
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  private async calculateChecksum(file: Blob): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.error('Checksum calculation error:', error);
      return '';
    }
  }

  // Check if file type is an image
  isImage(fileType: string): boolean {
    return fileType.startsWith('image/');
  }

  // Check if file type is a document
  isDocument(fileType: string): boolean {
    return (
      fileType.startsWith('application/') &&
      (fileType.includes('pdf') ||
        fileType.includes('word') ||
        fileType.includes('document') ||
        fileType.includes('excel') ||
        fileType.includes('sheet'))
    );
  }

  // Get file extension from filename
  getExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  // Get file icon based on type
  getFileIcon(fileType: string): string {
    if (this.isImage(fileType)) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('text')) return '📃';
    return '📁';
  }
}

// Export singleton instance
export const fileStorage = FileStorageSystem.getInstance();

// Convenience functions
export const uploadFile = (file: File, userId: string, options?: UploadOptions) =>
  fileStorage.upload(file, userId, options);

export const uploadFiles = (files: File[], userId: string, options?: UploadOptions) =>
  fileStorage.uploadMultiple(files, userId, options);

export const downloadFile = (bucket: string, path: string) =>
  fileStorage.download(bucket, path);

export const deleteFile = (bucket: string, path: string) =>
  fileStorage.delete(bucket, path);

export const getFileMetadata = (fileId: string) =>
  fileStorage.getMetadata(fileId);

export const listUserFiles = (userId: string, options?: any) =>
  fileStorage.listFiles(userId, options);

export const searchUserFiles = (userId: string, query: string, options?: any) =>
  fileStorage.searchFiles(userId, query, options);

export const getUserStorageStats = (userId: string) =>
  fileStorage.getStats(userId);

