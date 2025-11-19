/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiter
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RequestRecord>();

/**
 * Rate limit middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests } = config;

  return (identifier: string): boolean => {
    const now = Date.now();
    const record = store.get(identifier);

    // Clean up expired entries
    if (record && now > record.resetTime) {
      store.delete(identifier);
    }

    const currentRecord = store.get(identifier);

    if (!currentRecord) {
      store.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (currentRecord.count >= maxRequests) {
      return false;
    }

    currentRecord.count++;
    return true;
  };
}

/**
 * Create rate limiter for API routes
 */
export function createApiRateLimiter(maxRequests = 10, windowMs = 60000) {
  return rateLimit({ windowMs, maxRequests });
}

/**
 * Clear rate limit for identifier
 */
export function clearRateLimit(identifier: string): void {
  store.delete(identifier);
}

/**
 * Get rate limit info
 */
export function getRateLimitInfo(identifier: string): {
  remaining: number;
  resetTime: number;
} | null {
  const record = store.get(identifier);
  if (!record) {
    return null;
  }

  return {
    remaining: Math.max(0, record.count),
    resetTime: record.resetTime,
  };
}

