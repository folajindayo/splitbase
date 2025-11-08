import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  NETWORK = 'network',
  PAYMENT = 'payment',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  THIRD_PARTY = 'third_party',
  UNKNOWN = 'unknown',
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  stack?: string;
  code?: string;
  timestamp: string;
  context: ErrorContext;
  fingerprint: string;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ErrorGroup {
  fingerprint: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  count: number;
  firstSeen: string;
  lastSeen: string;
  affectedUsers: number;
  resolved: boolean;
  samples: ErrorReport[];
}

export interface ErrorMetrics {
  total: number;
  bySeverity: Record<ErrorSeverity, number>;
  byCategory: Record<ErrorCategory, number>;
  errorRate: number;
  affectedUsers: number;
  topErrors: Array<{ fingerprint: string; count: number; message: string }>;
  timeline: Array<{ hour: string; count: number }>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: {
    severity?: ErrorSeverity[];
    category?: ErrorCategory[];
    threshold?: number;
    timeWindow?: number; // minutes
  };
  actions: {
    notify?: string[]; // user IDs
    webhook?: string;
    email?: string[];
  };
  enabled: boolean;
}

class ErrorTrackingSystem {
  private static instance: ErrorTrackingSystem;
  private alertRules: AlertRule[] = [];

  private constructor() {}

  static getInstance(): ErrorTrackingSystem {
    if (!ErrorTrackingSystem.instance) {
      ErrorTrackingSystem.instance = new ErrorTrackingSystem();
    }
    return ErrorTrackingSystem.instance;
  }

  // Capture error
  async capture(
    error: Error,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context: Partial<ErrorContext> = {}
  ): Promise<ErrorReport> {
    try {
      const category = this.categorizeError(error);
      const fingerprint = this.generateFingerprint(error, category);

      // Check if error already exists
      const existing = await this.findByFingerprint(fingerprint);

      if (existing) {
        // Update occurrence count
        return this.updateOccurrence(existing.id);
      }

      // Create new error report
      const report: Omit<ErrorReport, 'id'> = {
        severity,
        category,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        timestamp: new Date().toISOString(),
        context: {
          userId: context.userId,
          sessionId: context.sessionId,
          requestId: context.requestId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          url: context.url,
          method: context.method,
          statusCode: context.statusCode,
          tags: context.tags,
          metadata: context.metadata,
        },
        fingerprint,
        occurrences: 1,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        resolved: false,
      };

      const { data, error: dbError } = await supabase
        .from('error_reports')
        .insert({
          severity: report.severity,
          category: report.category,
          message: report.message,
          stack: report.stack,
          code: report.code,
          timestamp: report.timestamp,
          context: report.context,
          fingerprint: report.fingerprint,
          occurrences: report.occurrences,
          first_seen_at: report.firstSeenAt,
          last_seen_at: report.lastSeenAt,
          resolved: report.resolved,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const errorReport = this.mapToErrorReport(data);

      // Check alert rules
      this.checkAlertRules(errorReport);

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`[${severity}] ${category}: ${error.message}`);
        if (error.stack) console.error(error.stack);
      }

      return errorReport;
    } catch (err) {
      console.error('Failed to capture error:', err);
      throw err;
    }
  }

  // Capture message (non-error)
  async captureMessage(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.INFO,
    context: Partial<ErrorContext> = {}
  ): Promise<ErrorReport> {
    const error = new Error(message);
    return this.capture(error, severity, context);
  }

  // Get error report
  async get(errorId: string): Promise<ErrorReport | null> {
    try {
      const { data, error } = await supabase
        .from('error_reports')
        .select('*')
        .eq('id', errorId)
        .single();

      if (error || !data) return null;

      return this.mapToErrorReport(data);
    } catch (error) {
      console.error('Failed to get error report:', error);
      return null;
    }
  }

  // List error reports
  async list(filter: {
    severity?: ErrorSeverity[];
    category?: ErrorCategory[];
    resolved?: boolean;
    startDate?: string;
    endDate?: string;
    userId?: string;
    limit?: number;
  } = {}): Promise<ErrorReport[]> {
    try {
      let query = supabase.from('error_reports').select('*');

      if (filter.severity && filter.severity.length > 0) {
        query = query.in('severity', filter.severity);
      }

      if (filter.category && filter.category.length > 0) {
        query = query.in('category', filter.category);
      }

      if (filter.resolved !== undefined) {
        query = query.eq('resolved', filter.resolved);
      }

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate);
      }

      if (filter.userId) {
        query = query.eq('context->>userId', filter.userId);
      }

      query = query.order('timestamp', { ascending: false });

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToErrorReport);
    } catch (error) {
      console.error('Failed to list errors:', error);
      return [];
    }
  }

  // Get error groups
  async getGroups(filter: {
    resolved?: boolean;
    minOccurrences?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ErrorGroup[]> {
    try {
      let query = supabase
        .from('error_reports')
        .select('fingerprint, message, category, severity, occurrences, first_seen_at, last_seen_at, resolved, context');

      if (filter.resolved !== undefined) {
        query = query.eq('resolved', filter.resolved);
      }

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by fingerprint
      const groups = new Map<string, ErrorGroup>();

      data?.forEach((err) => {
        if (!groups.has(err.fingerprint)) {
          groups.set(err.fingerprint, {
            fingerprint: err.fingerprint,
            message: err.message,
            category: err.category,
            severity: err.severity,
            count: 0,
            firstSeen: err.first_seen_at,
            lastSeen: err.last_seen_at,
            affectedUsers: new Set(),
            resolved: err.resolved,
            samples: [],
          } as any);
        }

        const group = groups.get(err.fingerprint)!;
        group.count += err.occurrences;
        if (err.context?.userId) {
          (group.affectedUsers as any).add(err.context.userId);
        }
        if (group.samples.length < 3) {
          group.samples.push(this.mapToErrorReport(err));
        }
      });

      // Convert Set to count
      const result = Array.from(groups.values()).map((group) => ({
        ...group,
        affectedUsers: (group.affectedUsers as any).size,
      }));

      // Filter by min occurrences
      if (filter.minOccurrences) {
        return result.filter((g) => g.count >= filter.minOccurrences);
      }

      return result.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Failed to get error groups:', error);
      return [];
    }
  }

  // Get metrics
  async getMetrics(filter: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ErrorMetrics> {
    try {
      let query = supabase.from('error_reports').select('*');

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const metrics: ErrorMetrics = {
        total: data?.length || 0,
        bySeverity: {
          [ErrorSeverity.DEBUG]: 0,
          [ErrorSeverity.INFO]: 0,
          [ErrorSeverity.WARNING]: 0,
          [ErrorSeverity.ERROR]: 0,
          [ErrorSeverity.FATAL]: 0,
        },
        byCategory: {
          [ErrorCategory.VALIDATION]: 0,
          [ErrorCategory.AUTHENTICATION]: 0,
          [ErrorCategory.AUTHORIZATION]: 0,
          [ErrorCategory.DATABASE]: 0,
          [ErrorCategory.NETWORK]: 0,
          [ErrorCategory.PAYMENT]: 0,
          [ErrorCategory.BUSINESS_LOGIC]: 0,
          [ErrorCategory.SYSTEM]: 0,
          [ErrorCategory.THIRD_PARTY]: 0,
          [ErrorCategory.UNKNOWN]: 0,
        },
        errorRate: 0,
        affectedUsers: 0,
        topErrors: [],
        timeline: [],
      };

      const affectedUsers = new Set<string>();
      const errorCounts = new Map<string, { count: number; message: string }>();
      const hourCounts: Record<string, number> = {};

      data?.forEach((err) => {
        metrics.bySeverity[err.severity as ErrorSeverity]++;
        metrics.byCategory[err.category as ErrorCategory]++;

        if (err.context?.userId) {
          affectedUsers.add(err.context.userId);
        }

        // Count by fingerprint
        const current = errorCounts.get(err.fingerprint) || { count: 0, message: err.message };
        current.count += err.occurrences;
        errorCounts.set(err.fingerprint, current);

        // Count by hour
        const hour = new Date(err.timestamp).toISOString().slice(0, 13);
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      metrics.affectedUsers = affectedUsers.size;

      // Top errors
      metrics.topErrors = Array.from(errorCounts.entries())
        .map(([fingerprint, data]) => ({
          fingerprint,
          count: data.count,
          message: data.message,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Timeline
      metrics.timeline = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

      // Calculate error rate (errors per hour)
      if (metrics.timeline.length > 0) {
        metrics.errorRate = metrics.total / metrics.timeline.length;
      }

      return metrics;
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return {
        total: 0,
        bySeverity: {} as any,
        byCategory: {} as any,
        errorRate: 0,
        affectedUsers: 0,
        topErrors: [],
        timeline: [],
      };
    }
  }

  // Resolve error
  async resolve(errorId: string, userId: string, notes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('error_reports')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
          resolution_notes: notes,
        })
        .eq('id', errorId);

      return !error;
    } catch (error) {
      console.error('Failed to resolve error:', error);
      return false;
    }
  }

  // Resolve error group
  async resolveGroup(fingerprint: string, userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('error_reports')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: userId,
        })
        .eq('fingerprint', fingerprint)
        .eq('resolved', false)
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to resolve error group:', error);
      return 0;
    }
  }

  // Add alert rule
  addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.alertRules.push({ id, ...rule });
    return id;
  }

  // Remove alert rule
  removeAlertRule(id: string): boolean {
    const index = this.alertRules.findIndex((r) => r.id === id);
    if (index >= 0) {
      this.alertRules.splice(index, 1);
      return true;
    }
    return false;
  }

  // Check alert rules
  private async checkAlertRules(error: ErrorReport): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check conditions
      if (rule.condition.severity && !rule.condition.severity.includes(error.severity)) {
        continue;
      }

      if (rule.condition.category && !rule.condition.category.includes(error.category)) {
        continue;
      }

      // Check threshold
      if (rule.condition.threshold && rule.condition.timeWindow) {
        const since = new Date();
        since.setMinutes(since.getMinutes() - rule.condition.timeWindow);

        const recent = await this.list({
          startDate: since.toISOString(),
          severity: rule.condition.severity,
          category: rule.condition.category,
        });

        if (recent.length < rule.condition.threshold) {
          continue;
        }
      }

      // Trigger alert
      this.triggerAlert(rule, error);
    }
  }

  // Trigger alert
  private async triggerAlert(rule: AlertRule, error: ErrorReport): Promise<void> {
    // Implementation would send notifications via email, webhook, etc.
    console.log(`Alert triggered: ${rule.name}`, error);
  }

  // Categorize error
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('validation') || message.includes('validation')) {
      return ErrorCategory.VALIDATION;
    }

    if (name.includes('auth') || message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorCategory.AUTHENTICATION;
    }

    if (message.includes('permission') || message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    }

    if (name.includes('database') || message.includes('query') || message.includes('connection')) {
      return ErrorCategory.DATABASE;
    }

    if (name.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }

    if (message.includes('payment') || message.includes('transaction')) {
      return ErrorCategory.PAYMENT;
    }

    if (name.includes('system') || message.includes('system')) {
      return ErrorCategory.SYSTEM;
    }

    return ErrorCategory.UNKNOWN;
  }

  // Generate fingerprint
  private generateFingerprint(error: Error, category: ErrorCategory): string {
    const crypto = require('crypto');
    const data = `${category}:${error.name}:${error.message}:${this.getStackFingerprint(error.stack)}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  // Get stack fingerprint
  private getStackFingerprint(stack?: string): string {
    if (!stack) return '';

    // Take first 3 lines of stack (most relevant)
    const lines = stack.split('\n').slice(0, 3);
    return lines.join('\n');
  }

  // Find by fingerprint
  private async findByFingerprint(fingerprint: string): Promise<ErrorReport | null> {
    try {
      const { data, error } = await supabase
        .from('error_reports')
        .select('*')
        .eq('fingerprint', fingerprint)
        .eq('resolved', false)
        .order('last_seen_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return this.mapToErrorReport(data);
    } catch (error) {
      return null;
    }
  }

  // Update occurrence
  private async updateOccurrence(errorId: string): Promise<ErrorReport> {
    const { data, error } = await supabase
      .from('error_reports')
      .update({
        occurrences: supabase.raw('occurrences + 1'),
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', errorId)
      .select()
      .single();

    if (error) throw error;

    return this.mapToErrorReport(data);
  }

  // Clean up old errors
  async cleanup(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('error_reports')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .eq('resolved', true)
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup errors:', error);
      return 0;
    }
  }

  // Map database record to ErrorReport
  private mapToErrorReport(data: any): ErrorReport {
    return {
      id: data.id,
      severity: data.severity,
      category: data.category,
      message: data.message,
      stack: data.stack,
      code: data.code,
      timestamp: data.timestamp,
      context: data.context || {},
      fingerprint: data.fingerprint,
      occurrences: data.occurrences,
      firstSeenAt: data.first_seen_at,
      lastSeenAt: data.last_seen_at,
      resolved: data.resolved,
      resolvedAt: data.resolved_at,
      resolvedBy: data.resolved_by,
    };
  }
}

// Export singleton instance
export const errorTracking = ErrorTrackingSystem.getInstance();

// Convenience functions
export const captureError = (
  error: Error,
  severity?: ErrorSeverity,
  context?: Partial<ErrorContext>
) => errorTracking.capture(error, severity, context);

export const captureMessage = (
  message: string,
  severity?: ErrorSeverity,
  context?: Partial<ErrorContext>
) => errorTracking.captureMessage(message, severity, context);

export const resolveError = (errorId: string, userId: string, notes?: string) =>
  errorTracking.resolve(errorId, userId, notes);

export const getErrorMetrics = (filter?: any) => errorTracking.getMetrics(filter);

// Error boundary helper
export class ErrorBoundary {
  static async wrap<T>(
    fn: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      await captureError(error as Error, ErrorSeverity.ERROR, context);
      throw error;
    }
  }
}
