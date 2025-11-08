import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum LogCategory {
  SYSTEM = 'system',
  API = 'api',
  DATABASE = 'database',
  AUTH = 'auth',
  PAYMENT = 'payment',
  ESCROW = 'escrow',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  USER_ACTION = 'user_action',
}

export interface LogEntry {
  id?: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

export interface LogFilter {
  level?: LogLevel | LogLevel[];
  category?: LogCategory | LogCategory[];
  startDate?: string;
  endDate?: string;
  userId?: string;
  requestId?: string;
  search?: string;
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<LogCategory, number>;
  errorRate: number;
  recentErrors: LogEntry[];
}

class Logger {
  private static instance: Logger;
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private minLevel: LogLevel = LogLevel.DEBUG;

  private constructor() {
    this.startAutoFlush();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Set minimum log level
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  // Debug log
  debug(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.DEBUG,
      category: LogCategory.SYSTEM,
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Info log
  info(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Warning log
  warn(message: string, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.WARN,
      category: LogCategory.SYSTEM,
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Error log
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      message,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // Fatal log
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log({
      level: LogLevel.FATAL,
      category: LogCategory.SYSTEM,
      message,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // Generic log method
  log(entry: LogEntry): void {
    // Check if level is enabled
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Add to buffer
    this.buffer.push(entry);

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      this.consoleOutput(entry);
    }

    // Flush if buffer is full
    if (this.buffer.length >= this.BUFFER_SIZE) {
      this.flush();
    }
  }

  // Flush buffer to database
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      const { error } = await supabase.from('logs').insert(
        entries.map((entry) => ({
          level: entry.level,
          category: entry.category,
          message: entry.message,
          timestamp: entry.timestamp,
          context: entry.context,
          user_id: entry.userId,
          request_id: entry.requestId,
          duration: entry.duration,
          error: entry.error,
          metadata: entry.metadata,
        }))
      );

      if (error) {
        console.error('Failed to flush logs:', error);
        // Put entries back in buffer
        this.buffer.unshift(...entries);
      }
    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Put entries back in buffer
      this.buffer.unshift(...entries);
    }
  }

  // Start auto-flush
  private startAutoFlush(): void {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  // Stop auto-flush
  stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  // Check if log level should be logged
  private shouldLog(level: LogLevel): boolean {
    const levels = [
      LogLevel.DEBUG,
      LogLevel.INFO,
      LogLevel.WARN,
      LogLevel.ERROR,
      LogLevel.FATAL,
    ];

    const currentIndex = levels.indexOf(this.minLevel);
    const logIndex = levels.indexOf(level);

    return logIndex >= currentIndex;
  }

  // Console output
  private consoleOutput(entry: LogEntry): void {
    const prefix = `[${entry.level.toUpperCase()}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.error || entry.context || '');
        break;
    }
  }

  // Query logs
  async query(filter: LogFilter = {}, options: {
    limit?: number;
    offset?: number;
    orderBy?: 'timestamp' | 'level';
    orderDirection?: 'asc' | 'desc';
  } = {}): Promise<LogEntry[]> {
    try {
      let query = supabase.from('logs').select('*');

      // Apply filters
      if (filter.level) {
        const levels = Array.isArray(filter.level) ? filter.level : [filter.level];
        query = query.in('level', levels);
      }

      if (filter.category) {
        const categories = Array.isArray(filter.category)
          ? filter.category
          : [filter.category];
        query = query.in('category', categories);
      }

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate);
      }

      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }

      if (filter.requestId) {
        query = query.eq('request_id', filter.requestId);
      }

      if (filter.search) {
        query = query.ilike('message', `%${filter.search}%`);
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
    } catch (error) {
      console.error('Failed to query logs:', error);
      return [];
    }
  }

  // Get log statistics
  async getStats(filter: LogFilter = {}): Promise<LogStats> {
    try {
      let query = supabase.from('logs').select('level, category, timestamp');

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats: LogStats = {
        total: data?.length || 0,
        byLevel: {
          [LogLevel.DEBUG]: 0,
          [LogLevel.INFO]: 0,
          [LogLevel.WARN]: 0,
          [LogLevel.ERROR]: 0,
          [LogLevel.FATAL]: 0,
        },
        byCategory: {
          [LogCategory.SYSTEM]: 0,
          [LogCategory.API]: 0,
          [LogCategory.DATABASE]: 0,
          [LogCategory.AUTH]: 0,
          [LogCategory.PAYMENT]: 0,
          [LogCategory.ESCROW]: 0,
          [LogCategory.SECURITY]: 0,
          [LogCategory.PERFORMANCE]: 0,
          [LogCategory.USER_ACTION]: 0,
        },
        errorRate: 0,
        recentErrors: [],
      };

      data?.forEach((log) => {
        stats.byLevel[log.level as LogLevel]++;
        stats.byCategory[log.category as LogCategory]++;
      });

      const errorCount =
        stats.byLevel[LogLevel.ERROR] + stats.byLevel[LogLevel.FATAL];
      stats.errorRate = stats.total > 0 ? (errorCount / stats.total) * 100 : 0;

      // Get recent errors
      stats.recentErrors = await this.query(
        { level: [LogLevel.ERROR, LogLevel.FATAL] },
        { limit: 10 }
      );

      return stats;
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return {
        total: 0,
        byLevel: {} as any,
        byCategory: {} as any,
        errorRate: 0,
        recentErrors: [],
      };
    }
  }

  // Clean up old logs
  async cleanup(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup logs:', error);
      return 0;
    }
  }

  // Create child logger with context
  child(context: Record<string, any>): ChildLogger {
    return new ChildLogger(this, context);
  }

  // Log API request
  logRequest(req: {
    method: string;
    url: string;
    userId?: string;
    duration?: number;
    statusCode?: number;
    requestId?: string;
  }): void {
    this.log({
      level: req.statusCode && req.statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO,
      category: LogCategory.API,
      message: `${req.method} ${req.url}`,
      userId: req.userId,
      requestId: req.requestId,
      duration: req.duration,
      context: {
        method: req.method,
        url: req.url,
        statusCode: req.statusCode,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Log performance metric
  logPerformance(metric: {
    name: string;
    duration: number;
    context?: Record<string, any>;
  }): void {
    this.log({
      level: LogLevel.INFO,
      category: LogCategory.PERFORMANCE,
      message: `Performance: ${metric.name}`,
      duration: metric.duration,
      context: metric.context,
      timestamp: new Date().toISOString(),
    });
  }

  // Log user action
  logUserAction(action: {
    userId: string;
    action: string;
    resource?: string;
    context?: Record<string, any>;
  }): void {
    this.log({
      level: LogLevel.INFO,
      category: LogCategory.USER_ACTION,
      message: `User action: ${action.action}`,
      userId: action.userId,
      context: {
        action: action.action,
        resource: action.resource,
        ...action.context,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

// Child logger with context
class ChildLogger {
  constructor(
    private parent: Logger,
    private context: Record<string, any>
  ) {}

  private mergeContext(context?: Record<string, any>): Record<string, any> {
    return { ...this.context, ...context };
  }

  debug(message: string, context?: Record<string, any>): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: Record<string, any>): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: Record<string, any>): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.parent.error(message, error, this.mergeContext(context));
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.parent.fatal(message, error, this.mergeContext(context));
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Express/API middleware
export const requestLogger = () => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;

    // Attach request ID to request
    req.requestId = requestId;

    // Log request end
    res.on('finish', () => {
      const duration = Date.now() - start;

      logger.logRequest({
        method: req.method,
        url: req.url,
        userId: req.user?.id,
        duration,
        statusCode: res.statusCode,
        requestId,
      });
    });

    next();
  };
};

// Performance timing decorator
export function LogPerformance(metricName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;

        logger.logPerformance({
          name,
          duration,
          context: { args: args.length },
        });

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        logger.logPerformance({
          name,
          duration,
          context: { args: args.length, error: true },
        });

        throw error;
      }
    };

    return descriptor;
  };
}

// Convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>) =>
    logger.debug(message, context),
  info: (message: string, context?: Record<string, any>) =>
    logger.info(message, context),
  warn: (message: string, context?: Record<string, any>) =>
    logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, any>) =>
    logger.error(message, error, context),
  fatal: (message: string, error?: Error, context?: Record<string, any>) =>
    logger.fatal(message, error, context),
};

