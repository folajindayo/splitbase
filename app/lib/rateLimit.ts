import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export interface RateLimitInfo {
  identifier: string;
  requests: number;
  limit: number;
  resetAt: Date;
  blocked: boolean;
}

class RateLimitSystem {
  private static instance: RateLimitSystem;
  private cache: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startCleanup();
  }

  static getInstance(): RateLimitSystem {
    if (!RateLimitSystem.instance) {
      RateLimitSystem.instance = new RateLimitSystem();
    }
    return RateLimitSystem.instance;
  }

  // Check rate limit
  async check(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = config.keyPrefix
      ? `${config.keyPrefix}:${identifier}`
      : identifier;

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get current count
    let current = this.cache.get(key);

    // Clean up expired entries
    if (current && current.resetAt < now) {
      this.cache.delete(key);
      current = undefined;
    }

    // Initialize if not exists
    if (!current) {
      current = {
        count: 0,
        resetAt: now + config.windowMs,
      };
    }

    // Increment count
    current.count++;

    // Check if limit exceeded
    const allowed = current.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - current.count);
    const resetAt = new Date(current.resetAt);

    // Update cache
    this.cache.set(key, current);

    // Log to database for analytics
    if (!allowed) {
      await this.logRateLimitViolation(identifier, config);
    }

    const result: RateLimitResult = {
      allowed,
      remaining,
      resetAt,
    };

    if (!allowed) {
      result.retryAfter = Math.ceil((current.resetAt - now) / 1000);
    }

    return result;
  }

  // Check and throw if exceeded
  async checkOrThrow(
    identifier: string,
    config: RateLimitConfig
  ): Promise<void> {
    const result = await this.check(identifier, config);

    if (!result.allowed) {
      const error: any = new Error('Rate limit exceeded');
      error.retryAfter = result.retryAfter;
      error.resetAt = result.resetAt;
      error.statusCode = 429;
      throw error;
    }
  }

  // Get rate limit info
  async getInfo(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitInfo> {
    const key = config.keyPrefix
      ? `${config.keyPrefix}:${identifier}`
      : identifier;

    const current = this.cache.get(key);
    const now = Date.now();

    if (!current || current.resetAt < now) {
      return {
        identifier,
        requests: 0,
        limit: config.maxRequests,
        resetAt: new Date(now + config.windowMs),
        blocked: false,
      };
    }

    return {
      identifier,
      requests: current.count,
      limit: config.maxRequests,
      resetAt: new Date(current.resetAt),
      blocked: current.count > config.maxRequests,
    };
  }

  // Reset rate limit for identifier
  async reset(identifier: string, keyPrefix?: string): Promise<void> {
    const key = keyPrefix ? `${keyPrefix}:${identifier}` : identifier;
    this.cache.delete(key);
  }

  // Block an identifier
  async block(
    identifier: string,
    durationMs: number,
    reason?: string
  ): Promise<void> {
    try {
      await supabase.from('rate_limit_blocks').insert({
        identifier,
        blocked_until: new Date(Date.now() + durationMs).toISOString(),
        reason,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to block identifier:', error);
    }
  }

  // Check if identifier is blocked
  async isBlocked(identifier: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('rate_limit_blocks')
        .select('*')
        .eq('identifier', identifier)
        .gt('blocked_until', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return !!data;
    } catch (error) {
      console.error('Failed to check if blocked:', error);
      return false;
    }
  }

  // Unblock an identifier
  async unblock(identifier: string): Promise<void> {
    try {
      await supabase
        .from('rate_limit_blocks')
        .delete()
        .eq('identifier', identifier);
    } catch (error) {
      console.error('Failed to unblock identifier:', error);
    }
  }

  // Log rate limit violation
  private async logRateLimitViolation(
    identifier: string,
    config: RateLimitConfig
  ): Promise<void> {
    try {
      await supabase.from('rate_limit_violations').insert({
        identifier,
        limit_type: config.keyPrefix || 'default',
        max_requests: config.maxRequests,
        window_ms: config.windowMs,
        violated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log rate limit violation:', error);
    }
  }

  // Get violation history
  async getViolations(
    identifier: string,
    limit: number = 100
  ): Promise<Array<{
    id: string;
    limitType: string;
    maxRequests: number;
    windowMs: number;
    violatedAt: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('rate_limit_violations')
        .select('*')
        .eq('identifier', identifier)
        .order('violated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get violations:', error);
      return [];
    }
  }

  // Clean up expired entries
  private startCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (value.resetAt < now) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Every minute
  }

  // Stop cleanup
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Clear all rate limits
  clear(): void {
    this.cache.clear();
  }

  // Get statistics
  getStats(): {
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
  } {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const value of this.cache.values()) {
      if (value.resetAt >= now) {
        active++;
      } else {
        expired++;
      }
    }

    return {
      totalKeys: this.cache.size,
      activeKeys: active,
      expiredKeys: expired,
    };
  }
}

// Export singleton instance
export const rateLimit = RateLimitSystem.getInstance();

// Predefined rate limit configurations
export const RateLimits = {
  // API endpoints
  API_DEFAULT: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    keyPrefix: 'api',
  },
  API_STRICT: {
    maxRequests: 10,
    windowMs: 60000,
    keyPrefix: 'api-strict',
  },
  
  // Authentication
  LOGIN: {
    maxRequests: 5,
    windowMs: 300000, // 5 minutes
    keyPrefix: 'login',
  },
  SIGNUP: {
    maxRequests: 3,
    windowMs: 3600000, // 1 hour
    keyPrefix: 'signup',
  },
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 3600000,
    keyPrefix: 'password-reset',
  },
  
  // Transactions
  ESCROW_CREATE: {
    maxRequests: 10,
    windowMs: 3600000,
    keyPrefix: 'escrow-create',
  },
  PAYMENT: {
    maxRequests: 20,
    windowMs: 3600000,
    keyPrefix: 'payment',
  },
  
  // File uploads
  FILE_UPLOAD: {
    maxRequests: 50,
    windowMs: 3600000,
    keyPrefix: 'file-upload',
  },
  
  // Webhooks
  WEBHOOK: {
    maxRequests: 1000,
    windowMs: 60000,
    keyPrefix: 'webhook',
  },
};

// Express/API middleware
export const rateLimitMiddleware = (config: RateLimitConfig) => {
  return async (req: any, res: any, next: any) => {
    try {
      // Get identifier (IP, user ID, or API key)
      const identifier =
        req.user?.id ||
        req.headers['x-api-key'] ||
        req.ip ||
        req.connection.remoteAddress;

      if (!identifier) {
        return res.status(400).json({ error: 'Could not identify request' });
      }

      // Check if blocked
      const blocked = await rateLimit.isBlocked(identifier);
      if (blocked) {
        return res.status(403).json({ error: 'Access blocked' });
      }

      // Check rate limit
      const result = await rateLimit.check(identifier, config);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': config.maxRequests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': result.resetAt.toISOString(),
      });

      if (!result.allowed) {
        res.set('Retry-After', result.retryAfter);
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: result.retryAfter,
          resetAt: result.resetAt,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      next();
    }
  };
};

// Decorator for rate limiting
export function RateLimit(config: RateLimitConfig) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const identifier = args[0]?.userId || args[0]?.user?.id || 'anonymous';

      await rateLimit.checkOrThrow(identifier, config);

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Adaptive rate limiting based on system load
export class AdaptiveRateLimit {
  private baseConfig: RateLimitConfig;
  private systemLoad: number = 0;

  constructor(baseConfig: RateLimitConfig) {
    this.baseConfig = baseConfig;
    this.monitorSystemLoad();
  }

  private monitorSystemLoad(): void {
    // Monitor system metrics (CPU, memory, etc.)
    setInterval(() => {
      // Simplified - in production, use actual system metrics
      const stats = rateLimit.getStats();
      this.systemLoad = stats.activeKeys / 1000; // Simple heuristic
    }, 10000); // Every 10 seconds
  }

  async check(identifier: string): Promise<RateLimitResult> {
    // Adjust limits based on load
    const adjustedConfig = { ...this.baseConfig };

    if (this.systemLoad > 0.8) {
      // High load - reduce limits by 50%
      adjustedConfig.maxRequests = Math.floor(adjustedConfig.maxRequests * 0.5);
    } else if (this.systemLoad > 0.6) {
      // Medium load - reduce by 25%
      adjustedConfig.maxRequests = Math.floor(adjustedConfig.maxRequests * 0.75);
    }

    return rateLimit.check(identifier, adjustedConfig);
  }
}

// Distributed rate limiting (for multiple servers)
export class DistributedRateLimit {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async check(identifier: string): Promise<RateLimitResult> {
    const key = this.config.keyPrefix
      ? `${this.config.keyPrefix}:${identifier}`
      : identifier;

    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Use database for distributed counting
      const { data: existing, error: fetchError } = await supabase
        .from('distributed_rate_limits')
        .select('*')
        .eq('key', key)
        .gt('reset_at', new Date(now).toISOString())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      let count = 1;
      let resetAt = new Date(now + this.config.windowMs);

      if (existing) {
        count = existing.count + 1;
        resetAt = new Date(existing.reset_at);

        await supabase
          .from('distributed_rate_limits')
          .update({
            count,
            updated_at: new Date().toISOString(),
          })
          .eq('key', key);
      } else {
        await supabase.from('distributed_rate_limits').upsert({
          key,
          count,
          reset_at: resetAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      const allowed = count <= this.config.maxRequests;
      const remaining = Math.max(0, this.config.maxRequests - count);

      return {
        allowed,
        remaining,
        resetAt,
        retryAfter: allowed ? undefined : Math.ceil((resetAt.getTime() - now) / 1000),
      };
    } catch (error) {
      console.error('Distributed rate limit error:', error);
      // Fallback to local rate limiting
      return rateLimit.check(identifier, this.config);
    }
  }
}

// Convenience functions
export const checkRateLimit = (identifier: string, config: RateLimitConfig) =>
  rateLimit.check(identifier, config);

export const resetRateLimit = (identifier: string, keyPrefix?: string) =>
  rateLimit.reset(identifier, keyPrefix);

export const blockIdentifier = (identifier: string, durationMs: number, reason?: string) =>
  rateLimit.block(identifier, durationMs, reason);

export const isIdentifierBlocked = (identifier: string) =>
  rateLimit.isBlocked(identifier);

