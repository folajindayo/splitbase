import { createClient } from '@supabase/supabase-js';
import { fileStorage } from './fileStorage';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface BackupConfig {
  tables: string[];
  includeFiles?: boolean;
  compression?: boolean;
  encryption?: boolean;
  schedule?: 'daily' | 'weekly' | 'monthly';
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  size: number;
  tables: string[];
  recordCount: number;
  format: 'json' | 'sql' | 'csv';
  compressed: boolean;
  encrypted: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  downloadUrl?: string;
  expiresAt?: string;
}

export interface RestoreOptions {
  backupId: string;
  tables?: string[];
  skipExisting?: boolean;
  validateData?: boolean;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'excel' | 'pdf';
  tables: string[];
  filters?: Record<string, any>;
  includeRelations?: boolean;
}

class BackupSystem {
  private static instance: BackupSystem;
  private readonly BACKUP_BUCKET = 'backups';
  private readonly BACKUP_RETENTION_DAYS = 30;

  private constructor() {}

  static getInstance(): BackupSystem {
    if (!BackupSystem.instance) {
      BackupSystem.instance = new BackupSystem();
    }
    return BackupSystem.instance;
  }

  // Create a full backup
  async createBackup(config: BackupConfig): Promise<string> {
    const backupId = this.generateBackupId();
    
    try {
      // Create backup metadata
      await supabase.from('backups').insert({
        id: backupId,
        timestamp: new Date().toISOString(),
        tables: config.tables,
        status: 'in_progress',
        compressed: config.compression || false,
        encrypted: config.encryption || false,
      });

      // Start backup process
      this.performBackup(backupId, config);

      return backupId;
    } catch (error: any) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  // Perform the actual backup
  private async performBackup(backupId: string, config: BackupConfig): Promise<void> {
    try {
      const backupData: Record<string, any[]> = {};
      let totalRecords = 0;

      // Export each table
      for (const table of config.tables) {
        const { data, error } = await supabase.from(table).select('*');

        if (error) throw error;

        backupData[table] = data || [];
        totalRecords += data?.length || 0;
      }

      // Add metadata
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        tables: config.tables,
        recordCount: totalRecords,
        data: backupData,
      };

      // Convert to JSON
      let content = JSON.stringify(backup, null, 2);

      // Compress if needed
      if (config.compression) {
        content = await this.compress(content);
      }

      // Encrypt if needed
      if (config.encryption) {
        content = await this.encrypt(content);
      }

      // Upload to storage
      const fileName = `backup-${backupId}.${config.compression ? 'gz' : 'json'}`;
      const blob = new Blob([content], { type: 'application/json' });
      const file = new File([blob], fileName);

      const uploadResult = await fileStorage.upload(file, 'system', {
        bucket: this.BACKUP_BUCKET,
        path: 'backups',
      });

      if (!uploadResult.success) {
        throw new Error('Failed to upload backup');
      }

      // Update backup metadata
      await supabase
        .from('backups')
        .update({
          status: 'completed',
          size: content.length,
          record_count: totalRecords,
          download_url: uploadResult.file?.url,
          expires_at: new Date(
            Date.now() + this.BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq('id', backupId);
    } catch (error: any) {
      console.error('Backup failed:', error);

      // Update status to failed
      await supabase
        .from('backups')
        .update({
          status: 'failed',
          error: error.message,
        })
        .eq('id', backupId);
    }
  }

  // Restore from backup
  async restore(options: RestoreOptions): Promise<boolean> {
    try {
      // Get backup metadata
      const { data: backup, error: metaError } = await supabase
        .from('backups')
        .select('*')
        .eq('id', options.backupId)
        .single();

      if (metaError || !backup) {
        throw new Error('Backup not found');
      }

      // Download backup file
      const response = await fetch(backup.download_url);
      let content = await response.text();

      // Decrypt if needed
      if (backup.encrypted) {
        content = await this.decrypt(content);
      }

      // Decompress if needed
      if (backup.compressed) {
        content = await this.decompress(content);
      }

      // Parse backup data
      const backupData = JSON.parse(content);

      // Restore each table
      const tablesToRestore = options.tables || backup.tables;

      for (const table of tablesToRestore) {
        const records = backupData.data[table];

        if (!records || records.length === 0) {
          continue;
        }

        if (options.skipExisting) {
          // Insert only new records
          for (const record of records) {
            await supabase.from(table).upsert(record);
          }
        } else {
          // Delete existing and insert all
          await supabase.from(table).delete().neq('id', '');
          await supabase.from(table).insert(records);
        }
      }

      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  // Export data in various formats
  async export(options: ExportOptions): Promise<string> {
    try {
      const exportData: Record<string, any[]> = {};

      // Fetch data from each table
      for (const table of options.tables) {
        let query = supabase.from(table).select('*');

        // Apply filters
        if (options.filters && options.filters[table]) {
          const filters = options.filters[table];
          for (const [field, value] of Object.entries(filters)) {
            query = query.eq(field, value);
          }
        }

        const { data, error } = await query;

        if (error) throw error;

        exportData[table] = data || [];
      }

      // Format based on type
      let content: string;

      switch (options.format) {
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          break;

        case 'csv':
          content = this.convertToCSV(exportData);
          break;

        case 'excel':
          content = await this.convertToExcel(exportData);
          break;

        case 'pdf':
          content = await this.convertToPDF(exportData);
          break;

        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      return content;
    } catch (error: any) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  // Get backup list
  async listBackups(limit: number = 20): Promise<BackupMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  // Get backup by ID
  async getBackup(backupId: string): Promise<BackupMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('*')
        .eq('id', backupId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to get backup:', error);
      return null;
    }
  }

  // Delete backup
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backup = await this.getBackup(backupId);

      if (!backup) {
        return false;
      }

      // Delete file from storage
      if (backup.downloadUrl) {
        // Extract path from URL
        const url = new URL(backup.downloadUrl);
        const path = url.pathname.split('/').pop();
        
        if (path) {
          await fileStorage.delete(this.BACKUP_BUCKET, `backups/${path}`);
        }
      }

      // Delete metadata
      const { error } = await supabase
        .from('backups')
        .delete()
        .eq('id', backupId);

      return !error;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  // Clean up old backups
  async cleanup(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.BACKUP_RETENTION_DAYS);

      const { data: oldBackups, error: fetchError } = await supabase
        .from('backups')
        .select('id')
        .lt('timestamp', cutoffDate.toISOString());

      if (fetchError) throw fetchError;

      let deletedCount = 0;

      for (const backup of oldBackups || []) {
        const deleted = await this.deleteBackup(backup.id);
        if (deleted) deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup backups:', error);
      return 0;
    }
  }

  // Schedule automatic backups
  async scheduleBackup(config: BackupConfig): Promise<void> {
    // This would integrate with a job scheduler
    // For now, just store the schedule
    try {
      await supabase.from('backup_schedules').insert({
        tables: config.tables,
        schedule: config.schedule || 'daily',
        compression: config.compression || false,
        encryption: config.encryption || false,
        active: true,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to schedule backup:', error);
    }
  }

  // Validate backup integrity
  async validateBackup(backupId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const backup = await this.getBackup(backupId);

      if (!backup) {
        errors.push('Backup not found');
        return { valid: false, errors };
      }

      if (backup.status !== 'completed') {
        errors.push('Backup is not completed');
      }

      if (!backup.downloadUrl) {
        errors.push('Backup file not found');
      }

      // Try to download and parse
      if (backup.downloadUrl) {
        try {
          const response = await fetch(backup.downloadUrl);
          let content = await response.text();

          if (backup.encrypted) {
            content = await this.decrypt(content);
          }

          if (backup.compressed) {
            content = await this.decompress(content);
          }

          JSON.parse(content);
        } catch (error) {
          errors.push('Backup file is corrupted or cannot be parsed');
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error: any) {
      errors.push(error.message);
      return { valid: false, errors };
    }
  }

  // Helper methods
  private generateBackupId(): string {
    return `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async compress(content: string): Promise<string> {
    // Simplified - in production, use actual compression library
    return content;
  }

  private async decompress(content: string): Promise<string> {
    // Simplified - in production, use actual decompression library
    return content;
  }

  private async encrypt(content: string): Promise<string> {
    // Simplified - in production, use actual encryption
    return content;
  }

  private async decrypt(content: string): Promise<string> {
    // Simplified - in production, use actual decryption
    return content;
  }

  private convertToCSV(data: Record<string, any[]>): string {
    let csv = '';

    for (const [table, records] of Object.entries(data)) {
      if (records.length === 0) continue;

      // Add table name
      csv += `\n\n# ${table}\n`;

      // Add headers
      const headers = Object.keys(records[0]);
      csv += headers.join(',') + '\n';

      // Add rows
      for (const record of records) {
        const values = headers.map(h => {
          const value = record[h];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        csv += values.join(',') + '\n';
      }
    }

    return csv;
  }

  private async convertToExcel(data: Record<string, any[]>): Promise<string> {
    // Simplified - in production, use library like xlsx
    return JSON.stringify(data);
  }

  private async convertToPDF(data: Record<string, any[]>): Promise<string> {
    // Simplified - in production, use library like pdfkit
    return JSON.stringify(data);
  }
}

// Export singleton instance
export const backup = BackupSystem.getInstance();

// Convenience functions
export const createBackup = (config: BackupConfig) =>
  backup.createBackup(config);

export const restoreBackup = (options: RestoreOptions) =>
  backup.restore(options);

export const exportData = (options: ExportOptions) =>
  backup.export(options);

export const listBackups = (limit?: number) =>
  backup.listBackups(limit);

export const deleteBackup = (backupId: string) =>
  backup.deleteBackup(backupId);

export const validateBackup = (backupId: string) =>
  backup.validateBackup(backupId);

// Example usage
export const exampleUsage = async () => {
  // Create a backup
  const backupId = await createBackup({
    tables: ['users', 'escrow_transactions', 'payments'],
    compression: true,
    encryption: true,
  });

  // List backups
  const backups = await listBackups(10);

  // Restore from backup
  await restoreBackup({
    backupId,
    skipExisting: true,
    validateData: true,
  });

  // Export data
  const csvData = await exportData({
    format: 'csv',
    tables: ['users'],
    filters: {
      users: { status: 'active' },
    },
  });

  // Validate backup
  const validation = await validateBackup(backupId);
  console.log('Backup valid:', validation.valid);
};

