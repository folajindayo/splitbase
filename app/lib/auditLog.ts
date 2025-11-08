import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Audit event categories
export enum AuditCategory {
  AUTH = 'auth',
  ESCROW = 'escrow',
  PAYMENT = 'payment',
  USER = 'user',
  SECURITY = 'security',
  ADMIN = 'admin',
  DISPUTE = 'dispute',
  SETTINGS = 'settings',
  API = 'api',
  SYSTEM = 'system',
}

// Audit event actions
export enum AuditAction {
  // Auth actions
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  TWO_FA_ENABLED = 'two_fa_enabled',
  TWO_FA_DISABLED = 'two_fa_disabled',
  
  // Escrow actions
  ESCROW_CREATED = 'escrow_created',
  ESCROW_UPDATED = 'escrow_updated',
  ESCROW_DELETED = 'escrow_deleted',
  ESCROW_FUNDED = 'escrow_funded',
  ESCROW_RELEASED = 'escrow_released',
  ESCROW_CANCELLED = 'escrow_cancelled',
  ESCROW_DISPUTED = 'escrow_disputed',
  ESCROW_EXPIRED = 'escrow_expired',
  
  // Payment actions
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_COMPLETED = 'payment_completed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',
  PAYMENT_METHOD_ADDED = 'payment_method_added',
  PAYMENT_METHOD_REMOVED = 'payment_method_removed',
  
  // User actions
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_VERIFIED = 'user_verified',
  USER_SUSPENDED = 'user_suspended',
  USER_UNSUSPENDED = 'user_unsuspended',
  PROFILE_UPDATED = 'profile_updated',
  
  // Security actions
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  IP_BLOCKED = 'ip_blocked',
  IP_UNBLOCKED = 'ip_unblocked',
  SECURITY_ALERT = 'security_alert',
  
  // Admin actions
  ADMIN_ACTION = 'admin_action',
  PERMISSION_CHANGED = 'permission_changed',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  
  // Dispute actions
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_UPDATED = 'dispute_updated',
  DISPUTE_RESOLVED = 'dispute_resolved',
  DISPUTE_EVIDENCE_SUBMITTED = 'dispute_evidence_submitted',
  
  // Settings actions
  SETTINGS_UPDATED = 'settings_updated',
  WEBHOOK_REGISTERED = 'webhook_registered',
  WEBHOOK_DELETED = 'webhook_deleted',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',
  
  // API actions
  API_REQUEST = 'api_request',
  API_RATE_LIMIT_EXCEEDED = 'api_rate_limit_exceeded',
  
  // System actions
  SYSTEM_ERROR = 'system_error',
  SYSTEM_WARNING = 'system_warning',
  BACKUP_CREATED = 'backup_created',
  MAINTENANCE_MODE = 'maintenance_mode',
}

// Audit severity levels
export enum AuditSeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  category: AuditCategory;
  action: AuditAction;
  severity: AuditSeverity;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  success: boolean;
  errorMessage?: string;
  timestamp: string;
  sessionId?: string;
}

export interface AuditLogFilter {
  userId?: string;
  category?: AuditCategory;
  action?: AuditAction;
  severity?: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  success?: boolean;
  search?: string;
}

class AuditLogSystem {
  private static instance: AuditLogSystem;
  private batchQueue: Omit<AuditLogEntry, 'id'>[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_DELAY = 5000; // 5 seconds

  private constructor() {}

  static getInstance(): AuditLogSystem {
    if (!AuditLogSystem.instance) {
      AuditLogSystem.instance = new AuditLogSystem();
    }
    return AuditLogSystem.instance;
  }

  // Log an audit event
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: Omit<AuditLogEntry, 'id'> = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Add to batch queue
    this.batchQueue.push(fullEntry);

    // If batch is full, flush immediately
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      await this.flushBatch();
    } else {
      // Otherwise, schedule a flush
      this.scheduleBatchFlush();
    }
  }

  // Schedule batch flush
  private scheduleBatchFlush(): void {
    if (this.batchTimeout) {
      return;
    }

    this.batchTimeout = setTimeout(() => {
      this.flushBatch();
    }, this.BATCH_DELAY);
  }

  // Flush the batch queue
  private async flushBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.batchQueue.length === 0) {
      return;
    }

    const entries = [...this.batchQueue];
    this.batchQueue = [];

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(entries);

      if (error) {
        console.error('Error saving audit logs:', error);
        // In case of error, we could implement a fallback mechanism
        // like writing to a local file or a backup database
      }
    } catch (error) {
      console.error('Error flushing audit logs:', error);
    }
  }

  // Query audit logs
  async query(
    filter: AuditLogFilter = {},
    options: {
      limit?: number;
      offset?: number;
      orderBy?: 'timestamp' | 'severity';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<AuditLogEntry[]> {
    let query = supabase.from('audit_logs').select('*');

    // Apply filters
    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }
    if (filter.category) {
      query = query.eq('category', filter.category);
    }
    if (filter.action) {
      query = query.eq('action', filter.action);
    }
    if (filter.severity) {
      query = query.eq('severity', filter.severity);
    }
    if (filter.resourceType) {
      query = query.eq('resource_type', filter.resourceType);
    }
    if (filter.resourceId) {
      query = query.eq('resource_id', filter.resourceId);
    }
    if (filter.startDate) {
      query = query.gte('timestamp', filter.startDate);
    }
    if (filter.endDate) {
      query = query.lte('timestamp', filter.endDate);
    }
    if (filter.success !== undefined) {
      query = query.eq('success', filter.success);
    }
    if (filter.search) {
      query = query.or(
        `description.ilike.%${filter.search}%,error_message.ilike.%${filter.search}%`
      );
    }

    // Apply ordering
    const orderBy = options.orderBy || 'timestamp';
    const orderDirection = options.orderDirection || 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 100) - 1
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // Get audit log statistics
  async getStats(
    filter: AuditLogFilter = {}
  ): Promise<{
    total: number;
    byCategory: Record<AuditCategory, number>;
    bySeverity: Record<AuditSeverity, number>;
    successRate: number;
    recentActivity: number;
  }> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('category, severity, success, timestamp')
      .gte('timestamp', filter.startDate || new Date(0).toISOString())
      .lte('timestamp', filter.endDate || new Date().toISOString());

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byCategory: {} as Record<AuditCategory, number>,
      bySeverity: {} as Record<AuditSeverity, number>,
      successRate: 0,
      recentActivity: 0,
    };

    if (data) {
      // Calculate category distribution
      Object.values(AuditCategory).forEach(cat => {
        stats.byCategory[cat] = data.filter(d => d.category === cat).length;
      });

      // Calculate severity distribution
      Object.values(AuditSeverity).forEach(sev => {
        stats.bySeverity[sev] = data.filter(d => d.severity === sev).length;
      });

      // Calculate success rate
      const successCount = data.filter(d => d.success).length;
      stats.successRate = stats.total > 0 ? (successCount / stats.total) * 100 : 0;

      // Recent activity (last hour)
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      stats.recentActivity = data.filter(d => d.timestamp > oneHourAgo).length;
    }

    return stats;
  }

  // Get activity timeline
  async getTimeline(
    userId: string,
    days: number = 30
  ): Promise<Array<{ date: string; count: number; categories: Record<AuditCategory, number> }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('timestamp, category')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // Group by date
    const timeline: Record<string, { count: number; categories: Record<AuditCategory, number> }> = {};

    data?.forEach(log => {
      const date = log.timestamp.split('T')[0];
      if (!timeline[date]) {
        timeline[date] = {
          count: 0,
          categories: {} as Record<AuditCategory, number>,
        };
      }
      timeline[date].count++;
      timeline[date].categories[log.category] =
        (timeline[date].categories[log.category] || 0) + 1;
    });

    return Object.entries(timeline).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  // Export audit logs
  async export(
    filter: AuditLogFilter = {},
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const logs = await this.query(filter, { limit: 10000 });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV format
      const headers = [
        'Timestamp',
        'User ID',
        'Category',
        'Action',
        'Severity',
        'Description',
        'Success',
        'IP Address',
        'Resource Type',
        'Resource ID',
      ];

      const rows = logs.map(log => [
        log.timestamp,
        log.userId || '',
        log.category,
        log.action,
        log.severity,
        log.description,
        log.success,
        log.ipAddress || '',
        log.resourceType || '',
        log.resourceId || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return csv;
    }
  }

  // Delete old audit logs (data retention)
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .select('id');

    if (error) throw error;
    return data?.length || 0;
  }

  // Get security alerts
  async getSecurityAlerts(
    severity: AuditSeverity = AuditSeverity.HIGH,
    hours: number = 24
  ): Promise<AuditLogEntry[]> {
    const startDate = new Date(Date.now() - hours * 3600000).toISOString();

    return this.query(
      {
        category: AuditCategory.SECURITY,
        severity,
        startDate,
      },
      {
        orderBy: 'timestamp',
        orderDirection: 'desc',
      }
    );
  }

  // Detect anomalies
  async detectAnomalies(userId: string): Promise<{
    suspiciousActivity: boolean;
    reasons: string[];
  }> {
    const last24Hours = new Date(Date.now() - 86400000).toISOString();

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', last24Hours);

    if (error) throw error;

    const reasons: string[] = [];
    let suspiciousActivity = false;

    if (data) {
      // Check for multiple failed login attempts
      const failedLogins = data.filter(
        log => log.action === AuditAction.LOGIN_FAILED
      ).length;
      if (failedLogins > 5) {
        suspiciousActivity = true;
        reasons.push(`${failedLogins} failed login attempts in 24 hours`);
      }

      // Check for unusual activity volume
      if (data.length > 500) {
        suspiciousActivity = true;
        reasons.push(`Unusually high activity: ${data.length} actions in 24 hours`);
      }

      // Check for multiple IP addresses
      const ipAddresses = new Set(data.map(log => log.ipAddress).filter(Boolean));
      if (ipAddresses.size > 10) {
        suspiciousActivity = true;
        reasons.push(`Multiple IP addresses: ${ipAddresses.size}`);
      }

      // Check for high-severity events
      const criticalEvents = data.filter(
        log => log.severity === AuditSeverity.CRITICAL
      ).length;
      if (criticalEvents > 0) {
        suspiciousActivity = true;
        reasons.push(`${criticalEvents} critical security events`);
      }
    }

    return { suspiciousActivity, reasons };
  }
}

// Export singleton instance
export const auditLog = AuditLogSystem.getInstance();

// Convenience functions for common audit events
export const logLogin = (userId: string, ipAddress: string, success: boolean) =>
  auditLog.log({
    userId,
    category: AuditCategory.AUTH,
    action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
    severity: success ? AuditSeverity.INFO : AuditSeverity.MEDIUM,
    description: success ? 'User logged in successfully' : 'Login attempt failed',
    ipAddress,
    success,
  });

export const logEscrowCreated = (userId: string, escrowId: string, amount: number) =>
  auditLog.log({
    userId,
    category: AuditCategory.ESCROW,
    action: AuditAction.ESCROW_CREATED,
    severity: AuditSeverity.INFO,
    description: `Escrow created with amount ${amount}`,
    resourceType: 'escrow',
    resourceId: escrowId,
    success: true,
    metadata: { amount },
  });

export const logSecurityAlert = (
  userId: string | undefined,
  description: string,
  severity: AuditSeverity,
  metadata?: Record<string, any>
) =>
  auditLog.log({
    userId,
    category: AuditCategory.SECURITY,
    action: AuditAction.SECURITY_ALERT,
    severity,
    description,
    metadata,
    success: true,
  });

