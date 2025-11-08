import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface RequestContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  method: string;
  path: string;
  query?: Record<string, any>;
  body?: Record<string, any>;
  headers: Record<string, string>;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: any) => string;
}

export interface CorsConfig {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean;
  };
}

class MiddlewareSystem {
  private static instance: MiddlewareSystem;
  private rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

  private constructor() {}

  static getInstance(): MiddlewareSystem {
    if (!MiddlewareSystem.instance) {
      MiddlewareSystem.instance = new MiddlewareSystem();
    }
    return MiddlewareSystem.instance;
  }

  // Request ID middleware
  requestId() {
    return (req: any, res: any, next: any) => {
      const requestId =
        req.headers['x-request-id'] ||
        `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      req.requestId = requestId;
      res.setHeader('X-Request-ID', requestId);

      next();
    };
  }

  // Context builder middleware
  buildContext() {
    return (req: any, res: any, next: any) => {
      const context: RequestContext = {
        requestId: req.requestId || `req-${Date.now()}`,
        userId: req.user?.id,
        sessionId: req.session?.id,
        ipAddress: this.getIpAddress(req),
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path || req.url,
        query: req.query,
        body: req.body,
        headers: this.sanitizeHeaders(req.headers),
      };

      req.context = context;
      next();
    };
  }

  // Rate limiting middleware
  rateLimit(config: RateLimitConfig) {
    return (req: any, res: any, next: any) => {
      const key = config.keyGenerator
        ? config.keyGenerator(req)
        : this.getIpAddress(req);

      const now = Date.now();
      const record = this.rateLimitStore.get(key);

      if (record && record.resetAt > now) {
        if (record.count >= config.maxRequests) {
          res.setHeader('X-RateLimit-Limit', config.maxRequests);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('X-RateLimit-Reset', record.resetAt);

          return res.status(429).json({
            error: config.message || 'Too many requests',
            retryAfter: Math.ceil((record.resetAt - now) / 1000),
          });
        }

        record.count++;
      } else {
        this.rateLimitStore.set(key, {
          count: 1,
          resetAt: now + config.windowMs,
        });
      }

      const currentRecord = this.rateLimitStore.get(key)!;
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader(
        'X-RateLimit-Remaining',
        Math.max(0, config.maxRequests - currentRecord.count)
      );
      res.setHeader('X-RateLimit-Reset', currentRecord.resetAt);

      next();
    };
  }

  // CORS middleware
  cors(config: CorsConfig = {}) {
    return (req: any, res: any, next: any) => {
      const origin = req.headers.origin;

      // Handle origin
      if (config.origin) {
        if (typeof config.origin === 'string') {
          res.setHeader('Access-Control-Allow-Origin', config.origin);
        } else if (Array.isArray(config.origin)) {
          if (config.origin.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
          }
        } else if (typeof config.origin === 'function') {
          if (config.origin(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
          }
        }
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }

      // Handle credentials
      if (config.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      // Handle methods
      const methods = config.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
      res.setHeader('Access-Control-Allow-Methods', methods.join(', '));

      // Handle headers
      const allowedHeaders = config.allowedHeaders || [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
      ];
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));

      // Handle exposed headers
      if (config.exposedHeaders) {
        res.setHeader('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
      }

      // Handle max age
      if (config.maxAge) {
        res.setHeader('Access-Control-Max-Age', config.maxAge);
      }

      // Handle preflight
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }

      next();
    };
  }

  // Authentication middleware
  authenticate() {
    return async (req: any, res: any, next: any) => {
      try {
        const token =
          req.headers.authorization?.replace('Bearer ', '') ||
          req.cookies?.token;

        if (!token) {
          return res.status(401).json({ error: 'No authentication token provided' });
        }

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        req.token = token;

        next();
      } catch (error) {
        return res.status(401).json({ error: 'Authentication failed' });
      }
    };
  }

  // Authorization middleware
  authorize(permissions: string | string[]) {
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

    return async (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      try {
        // Get user permissions from database
        const { data: userPermissions, error } = await supabase
          .from('user_permissions')
          .select('permission')
          .eq('user_id', req.user.id);

        if (error) throw error;

        const permissions = userPermissions?.map((p) => p.permission) || [];

        // Check if user has required permissions
        const hasPermission = requiredPermissions.some((required) =>
          permissions.includes(required)
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            required: requiredPermissions,
          });
        }

        req.permissions = permissions;
        next();
      } catch (error) {
        return res.status(500).json({ error: 'Authorization check failed' });
      }
    };
  }

  // Validation middleware
  validate(schema: ValidationSchema, target: 'body' | 'query' | 'params' = 'body') {
    return (req: any, res: any, next: any) => {
      const data = req[target];
      const errors: Record<string, string> = {};

      for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];

        // Required check
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors[field] = `${field} is required`;
          continue;
        }

        // Skip validation if not required and value is empty
        if (!rules.required && (value === undefined || value === null || value === '')) {
          continue;
        }

        // Type check
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type && value !== null && value !== undefined) {
          errors[field] = `${field} must be of type ${rules.type}`;
          continue;
        }

        // Min/Max check for strings
        if (rules.type === 'string') {
          if (rules.min !== undefined && value.length < rules.min) {
            errors[field] = `${field} must be at least ${rules.min} characters`;
          }
          if (rules.max !== undefined && value.length > rules.max) {
            errors[field] = `${field} must be at most ${rules.max} characters`;
          }
        }

        // Min/Max check for numbers
        if (rules.type === 'number') {
          if (rules.min !== undefined && value < rules.min) {
            errors[field] = `${field} must be at least ${rules.min}`;
          }
          if (rules.max !== undefined && value > rules.max) {
            errors[field] = `${field} must be at most ${rules.max}`;
          }
        }

        // Pattern check
        if (rules.pattern && !rules.pattern.test(value)) {
          errors[field] = `${field} format is invalid`;
        }

        // Enum check
        if (rules.enum && !rules.enum.includes(value)) {
          errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
        }

        // Custom validation
        if (rules.custom && !rules.custom(value)) {
          errors[field] = `${field} validation failed`;
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
      }

      next();
    };
  }

  // Error handler middleware
  errorHandler() {
    return (err: any, req: any, res: any, next: any) => {
      console.error('Error:', err);

      const statusCode = err.statusCode || err.status || 500;
      const message = err.message || 'Internal server error';

      // Log error
      if (statusCode >= 500) {
        this.logError(err, req);
      }

      res.status(statusCode).json({
        error: message,
        requestId: req.requestId,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      });
    };
  }

  // Request logger middleware
  requestLogger() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();

      // Log request end
      res.on('finish', () => {
        const duration = Date.now() - start;

        this.logRequest({
          requestId: req.requestId,
          method: req.method,
          path: req.path || req.url,
          statusCode: res.statusCode,
          duration,
          userId: req.user?.id,
          ipAddress: this.getIpAddress(req),
        });
      });

      next();
    };
  }

  // Body parser middleware
  bodyParser() {
    return (req: any, res: any, next: any) => {
      if (req.headers['content-type']?.includes('application/json')) {
        let body = '';

        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            req.body = JSON.parse(body);
            next();
          } catch (error) {
            res.status(400).json({ error: 'Invalid JSON' });
          }
        });
      } else {
        next();
      }
    };
  }

  // Compression middleware
  compress() {
    return (req: any, res: any, next: any) => {
      const acceptEncoding = req.headers['accept-encoding'] || '';

      if (acceptEncoding.includes('gzip')) {
        res.setHeader('Content-Encoding', 'gzip');
      } else if (acceptEncoding.includes('deflate')) {
        res.setHeader('Content-Encoding', 'deflate');
      }

      next();
    };
  }

  // Cache control middleware
  cacheControl(maxAge: number = 3600) {
    return (req: any, res: any, next: any) => {
      if (req.method === 'GET') {
        res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
      } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }

      next();
    };
  }

  // Security headers middleware
  securityHeaders() {
    return (req: any, res: any, next: any) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
      );

      next();
    };
  }

  // Timeout middleware
  timeout(ms: number = 30000) {
    return (req: any, res: any, next: any) => {
      const timer = setTimeout(() => {
        if (!res.headersSent) {
          res.status(408).json({ error: 'Request timeout' });
        }
      }, ms);

      res.on('finish', () => {
        clearTimeout(timer);
      });

      next();
    };
  }

  // API versioning middleware
  apiVersion(version: string) {
    return (req: any, res: any, next: any) => {
      req.apiVersion = version;
      res.setHeader('X-API-Version', version);

      next();
    };
  }

  // Helper methods
  private getIpAddress(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const [key, value] of Object.entries(headers)) {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  private async logRequest(data: {
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    userId?: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await supabase.from('request_logs').insert({
        request_id: data.requestId,
        method: data.method,
        path: data.path,
        status_code: data.statusCode,
        duration: data.duration,
        user_id: data.userId,
        ip_address: data.ipAddress,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log request:', error);
    }
  }

  private async logError(error: any, req: any): Promise<void> {
    try {
      await supabase.from('error_logs').insert({
        request_id: req.requestId,
        error_message: error.message,
        error_stack: error.stack,
        method: req.method,
        path: req.path || req.url,
        user_id: req.user?.id,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  }
}

// Export singleton instance
export const middleware = MiddlewareSystem.getInstance();

// Convenience exports
export const requestId = () => middleware.requestId();
export const buildContext = () => middleware.buildContext();
export const rateLimit = (config: RateLimitConfig) => middleware.rateLimit(config);
export const cors = (config?: CorsConfig) => middleware.cors(config);
export const authenticate = () => middleware.authenticate();
export const authorize = (permissions: string | string[]) =>
  middleware.authorize(permissions);
export const validate = (
  schema: ValidationSchema,
  target?: 'body' | 'query' | 'params'
) => middleware.validate(schema, target);
export const errorHandler = () => middleware.errorHandler();
export const requestLogger = () => middleware.requestLogger();
export const securityHeaders = () => middleware.securityHeaders();
export const cacheControl = (maxAge?: number) => middleware.cacheControl(maxAge);
export const timeout = (ms?: number) => middleware.timeout(ms);
export const apiVersion = (version: string) => middleware.apiVersion(version);

