import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum DocumentType {
  PDF = 'pdf',
  WORD = 'word',
  EXCEL = 'excel',
  POWERPOINT = 'powerpoint',
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  OTHER = 'other',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum AccessLevel {
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
  INTERNAL = 'internal',
  PUBLIC = 'public',
}

export enum Permission {
  VIEW = 'view',
  DOWNLOAD = 'download',
  EDIT = 'edit',
  DELETE = 'delete',
  SHARE = 'share',
  ADMIN = 'admin',
}

export enum VersionAction {
  CREATED = 'created',
  UPDATED = 'updated',
  RESTORED = 'restored',
  DELETED = 'deleted',
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  folderId?: string;
  ownerId: string;
  status: DocumentStatus;
  accessLevel: AccessLevel;
  tags: string[];
  metadata: DocumentMetadata;
  version: number;
  checksum: string;
  encryptedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentMetadata {
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  pageCount?: number;
  wordCount?: number;
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  customFields?: Record<string, any>;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  ownerId: string;
  path: string;
  accessLevel: AccessLevel;
  color?: string;
  icon?: string;
  documentCount: number;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface Version {
  id: string;
  documentId: string;
  version: number;
  action: VersionAction;
  url: string;
  size: number;
  checksum: string;
  comment?: string;
  createdBy: string;
  createdAt: string;
}

export interface Share {
  id: string;
  documentId: string;
  sharedBy: string;
  sharedWith?: string;
  shareType: 'user' | 'group' | 'link' | 'public';
  permissions: Permission[];
  expiresAt?: string;
  password?: string;
  downloadLimit?: number;
  downloadCount: number;
  token?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  content: string;
  resolved: boolean;
  position?: {
    page?: number;
    x?: number;
    y?: number;
  };
  parentId?: string;
  replies: number;
  createdAt: string;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  documentId: string;
  userId: string;
  type: 'highlight' | 'note' | 'drawing' | 'stamp';
  data: any;
  page?: number;
  color?: string;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: DocumentType;
  url: string;
  thumbnailUrl?: string;
  fields: TemplateField[];
  usageCount: number;
  active: boolean;
  createdBy: string;
  createdAt: string;
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'signature' | 'image';
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Signature {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  signatureData: string;
  position: {
    page: number;
    x: number;
    y: number;
  };
  timestamp: string;
  ipAddress: string;
  verified: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  status: 'active' | 'paused' | 'completed';
  createdBy: string;
  createdAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'review' | 'approval' | 'signature' | 'notification';
  assignedTo: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  order: number;
  dueDate?: string;
  completedBy?: string;
  completedAt?: string;
}

export interface SearchQuery {
  query?: string;
  type?: DocumentType;
  folder?: string;
  owner?: string;
  tags?: string[];
  status?: DocumentStatus;
  dateRange?: {
    start?: string;
    end?: string;
  };
  sizeRange?: {
    min?: number;
    max?: number;
  };
}

export interface Activity {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  action: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface DocumentAnalytics {
  totalDocuments: number;
  totalSize: number;
  byType: Record<DocumentType, number>;
  byStatus: Record<DocumentStatus, number>;
  recentActivity: Activity[];
  topDocuments: Array<{
    documentId: string;
    name: string;
    views: number;
    downloads: number;
  }>;
  storageUsage: Array<{
    userId: string;
    userName: string;
    size: number;
    documentCount: number;
  }>;
}

class DocumentManagementSystem {
  private static instance: DocumentManagementSystem;

  private constructor() {}

  static getInstance(): DocumentManagementSystem {
    if (!DocumentManagementSystem.instance) {
      DocumentManagementSystem.instance = new DocumentManagementSystem();
    }
    return DocumentManagementSystem.instance;
  }

  // Upload document
  async uploadDocument(document: Omit<Document, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    try {
      const documentData = {
        name: document.name,
        description: document.description,
        type: document.type,
        size: document.size,
        mime_type: document.mimeType,
        url: document.url,
        thumbnail_url: document.thumbnailUrl,
        folder_id: document.folderId,
        owner_id: document.ownerId,
        status: document.status,
        access_level: document.accessLevel,
        tags: document.tags,
        metadata: document.metadata,
        version: 1,
        checksum: document.checksum,
        encrypted_at: document.encryptedAt,
        expires_at: document.expiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;

      // Create first version
      await this.createVersion(data.id, document.url, document.size, document.checksum, document.ownerId, VersionAction.CREATED);

      // Update folder size
      if (document.folderId) {
        await this.updateFolderSize(document.folderId);
      }

      // Log activity
      await this.logActivity(data.id, document.ownerId, 'uploaded');

      return this.mapToDocument(data);
    } catch (error: any) {
      console.error('Failed to upload document:', error);
      throw error;
    }
  }

  // Get document
  async getDocument(documentId: string): Promise<Document | null> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !data) return null;

      return this.mapToDocument(data);
    } catch (error) {
      console.error('Failed to get document:', error);
      return null;
    }
  }

  // Search documents
  async searchDocuments(query: SearchQuery, limit: number = 50): Promise<Document[]> {
    try {
      let q = supabase.from('documents').select('*');

      if (query.query) {
        q = q.or(`name.ilike.%${query.query}%,description.ilike.%${query.query}%`);
      }

      if (query.type) {
        q = q.eq('type', query.type);
      }

      if (query.folder) {
        q = q.eq('folder_id', query.folder);
      }

      if (query.owner) {
        q = q.eq('owner_id', query.owner);
      }

      if (query.status) {
        q = q.eq('status', query.status);
      }

      if (query.tags && query.tags.length > 0) {
        q = q.contains('tags', query.tags);
      }

      if (query.dateRange?.start) {
        q = q.gte('created_at', query.dateRange.start);
      }

      if (query.dateRange?.end) {
        q = q.lte('created_at', query.dateRange.end);
      }

      if (query.sizeRange?.min) {
        q = q.gte('size', query.sizeRange.min);
      }

      if (query.sizeRange?.max) {
        q = q.lte('size', query.sizeRange.max);
      }

      q = q.order('updated_at', { ascending: false }).limit(limit);

      const { data, error } = await q;

      if (error) throw error;

      return (data || []).map(this.mapToDocument);
    } catch (error) {
      console.error('Failed to search documents:', error);
      return [];
    }
  }

  // Create folder
  async createFolder(folder: Omit<Folder, 'id' | 'path' | 'documentCount' | 'size' | 'createdAt' | 'updatedAt'>): Promise<Folder> {
    try {
      // Build path
      let path = '/';
      if (folder.parentId) {
        const parent = await this.getFolder(folder.parentId);
        if (parent) {
          path = `${parent.path}${parent.name}/`;
        }
      }

      const folderData = {
        name: folder.name,
        description: folder.description,
        parent_id: folder.parentId,
        owner_id: folder.ownerId,
        path,
        access_level: folder.accessLevel,
        color: folder.color,
        icon: folder.icon,
        document_count: 0,
        size: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('folders')
        .insert(folderData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToFolder(data);
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }

  // Get folder
  async getFolder(folderId: string): Promise<Folder | null> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('id', folderId)
        .single();

      if (error || !data) return null;

      return this.mapToFolder(data);
    } catch (error) {
      console.error('Failed to get folder:', error);
      return null;
    }
  }

  // Create version
  async createVersion(documentId: string, url: string, size: number, checksum: string, userId: string, action: VersionAction, comment?: string): Promise<Version> {
    try {
      const document = await this.getDocument(documentId);
      if (!document) throw new Error('Document not found');

      const versionData = {
        document_id: documentId,
        version: document.version + 1,
        action,
        url,
        size,
        checksum,
        comment,
        created_by: userId,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('document_versions')
        .insert(versionData)
        .select()
        .single();

      if (error) throw error;

      // Update document version
      await supabase
        .from('documents')
        .update({
          version: versionData.version,
          url,
          size,
          checksum,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      return this.mapToVersion(data);
    } catch (error: any) {
      console.error('Failed to create version:', error);
      throw error;
    }
  }

  // Get versions
  async getVersions(documentId: string): Promise<Version[]> {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToVersion);
    } catch (error) {
      console.error('Failed to get versions:', error);
      return [];
    }
  }

  // Share document
  async shareDocument(share: Omit<Share, 'id' | 'downloadCount' | 'createdAt'>): Promise<Share> {
    try {
      const shareData = {
        document_id: share.documentId,
        shared_by: share.sharedBy,
        shared_with: share.sharedWith,
        share_type: share.shareType,
        permissions: share.permissions,
        expires_at: share.expiresAt,
        password: share.password,
        download_limit: share.downloadLimit,
        download_count: 0,
        token: share.token || this.generateToken(),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('document_shares')
        .insert(shareData)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(share.documentId, share.sharedBy, 'shared');

      return this.mapToShare(data);
    } catch (error: any) {
      console.error('Failed to share document:', error);
      throw error;
    }
  }

  // Add comment
  async addComment(comment: Omit<Comment, 'id' | 'replies' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    try {
      const commentData = {
        document_id: comment.documentId,
        user_id: comment.userId,
        user_name: comment.userName,
        content: comment.content,
        resolved: comment.resolved,
        position: comment.position,
        parent_id: comment.parentId,
        replies: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('document_comments')
        .insert(commentData)
        .select()
        .single();

      if (error) throw error;

      // Update parent reply count
      if (comment.parentId) {
        await supabase.rpc('increment_comment_replies', { comment_id_param: comment.parentId });
      }

      return this.mapToComment(data);
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  // Get comments
  async getComments(documentId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(this.mapToComment);
    } catch (error) {
      console.error('Failed to get comments:', error);
      return [];
    }
  }

  // Add signature
  async addSignature(signature: Omit<Signature, 'id'>): Promise<Signature> {
    try {
      const signatureData = {
        document_id: signature.documentId,
        user_id: signature.userId,
        user_name: signature.userName,
        signature_data: signature.signatureData,
        position: signature.position,
        timestamp: signature.timestamp,
        ip_address: signature.ipAddress,
        verified: signature.verified,
      };

      const { data, error } = await supabase
        .from('document_signatures')
        .insert(signatureData)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(signature.documentId, signature.userId, 'signed');

      return this.mapToSignature(data);
    } catch (error: any) {
      console.error('Failed to add signature:', error);
      throw error;
    }
  }

  // Get analytics
  async getAnalytics(): Promise<DocumentAnalytics> {
    try {
      const { data: documents } = await supabase.from('documents').select('*');

      const totalDocuments = documents?.length || 0;
      const totalSize = documents?.reduce((sum, d) => sum + d.size, 0) || 0;

      const byType: Record<DocumentType, number> = {} as any;
      documents?.forEach(d => {
        byType[d.type as DocumentType] = (byType[d.type as DocumentType] || 0) + 1;
      });

      const byStatus: Record<DocumentStatus, number> = {} as any;
      documents?.forEach(d => {
        byStatus[d.status as DocumentStatus] = (byStatus[d.status as DocumentStatus] || 0) + 1;
      });

      const { data: activities } = await supabase
        .from('document_activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      const recentActivity = (activities || []).map(this.mapToActivity);

      return {
        totalDocuments,
        totalSize,
        byType,
        byStatus,
        recentActivity,
        topDocuments: [],
        storageUsage: [],
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalDocuments: 0,
        totalSize: 0,
        byType: {} as any,
        byStatus: {} as any,
        recentActivity: [],
        topDocuments: [],
        storageUsage: [],
      };
    }
  }

  // Helper methods
  private async updateFolderSize(folderId: string): Promise<void> {
    try {
      const { data: documents } = await supabase
        .from('documents')
        .select('size')
        .eq('folder_id', folderId);

      const totalSize = documents?.reduce((sum, d) => sum + d.size, 0) || 0;
      const count = documents?.length || 0;

      await supabase
        .from('folders')
        .update({
          size: totalSize,
          document_count: count,
          updated_at: new Date().toISOString(),
        })
        .eq('id', folderId);
    } catch (error) {
      console.error('Failed to update folder size:', error);
    }
  }

  private async logActivity(documentId: string, userId: string, action: string, details?: Record<string, any>): Promise<void> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      await supabase.from('document_activities').insert({
        document_id: documentId,
        user_id: userId,
        user_name: user?.full_name || 'Unknown',
        action,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  private generateToken(): string {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private mapToDocument(data: any): Document {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      size: data.size,
      mimeType: data.mime_type,
      url: data.url,
      thumbnailUrl: data.thumbnail_url,
      folderId: data.folder_id,
      ownerId: data.owner_id,
      status: data.status,
      accessLevel: data.access_level,
      tags: data.tags,
      metadata: data.metadata,
      version: data.version,
      checksum: data.checksum,
      encryptedAt: data.encrypted_at,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToFolder(data: any): Folder {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      parentId: data.parent_id,
      ownerId: data.owner_id,
      path: data.path,
      accessLevel: data.access_level,
      color: data.color,
      icon: data.icon,
      documentCount: data.document_count,
      size: data.size,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToVersion(data: any): Version {
    return {
      id: data.id,
      documentId: data.document_id,
      version: data.version,
      action: data.action,
      url: data.url,
      size: data.size,
      checksum: data.checksum,
      comment: data.comment,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }

  private mapToShare(data: any): Share {
    return {
      id: data.id,
      documentId: data.document_id,
      sharedBy: data.shared_by,
      sharedWith: data.shared_with,
      shareType: data.share_type,
      permissions: data.permissions,
      expiresAt: data.expires_at,
      password: data.password,
      downloadLimit: data.download_limit,
      downloadCount: data.download_count,
      token: data.token,
      createdAt: data.created_at,
    };
  }

  private mapToComment(data: any): Comment {
    return {
      id: data.id,
      documentId: data.document_id,
      userId: data.user_id,
      userName: data.user_name,
      content: data.content,
      resolved: data.resolved,
      position: data.position,
      parentId: data.parent_id,
      replies: data.replies,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToSignature(data: any): Signature {
    return {
      id: data.id,
      documentId: data.document_id,
      userId: data.user_id,
      userName: data.user_name,
      signatureData: data.signature_data,
      position: data.position,
      timestamp: data.timestamp,
      ipAddress: data.ip_address,
      verified: data.verified,
    };
  }

  private mapToActivity(data: any): Activity {
    return {
      id: data.id,
      documentId: data.document_id,
      userId: data.user_id,
      userName: data.user_name,
      action: data.action,
      details: data.details,
      timestamp: data.timestamp,
    };
  }
}

// Export singleton instance
export const documentManagement = DocumentManagementSystem.getInstance();

// Convenience functions
export const uploadDocument = (document: any) => documentManagement.uploadDocument(document);
export const getDocument = (documentId: string) => documentManagement.getDocument(documentId);
export const searchDocuments = (query: SearchQuery, limit?: number) => documentManagement.searchDocuments(query, limit);
export const createFolder = (folder: any) => documentManagement.createFolder(folder);
export const getFolder = (folderId: string) => documentManagement.getFolder(folderId);
export const createDocumentVersion = (documentId: string, url: string, size: number, checksum: string, userId: string, action: VersionAction, comment?: string) =>
  documentManagement.createVersion(documentId, url, size, checksum, userId, action, comment);
export const getDocumentVersions = (documentId: string) => documentManagement.getVersions(documentId);
export const shareDocument = (share: any) => documentManagement.shareDocument(share);
export const addDocumentComment = (comment: any) => documentManagement.addComment(comment);
export const getDocumentComments = (documentId: string) => documentManagement.getComments(documentId);
export const addDocumentSignature = (signature: any) => documentManagement.addSignature(signature);
export const getDocumentAnalytics = () => documentManagement.getAnalytics();


