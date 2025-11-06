import { supabase } from "./supabase";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string; // IP address or wallet address
}

interface RateLimitRecord {
  identifier: string;
  count: number;
  windowStart: number;
}

// In-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Check if request is rate limited
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute default
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  // Get or create record
  let record = rateLimitStore.get(key);

  // If no record or window expired, create new
  if (!record || now - record.windowStart >= windowMs) {
    record = {
      identifier,
      count: 1,
      windowStart: now,
    };
    rateLimitStore.set(key, record);

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(key, record);

  const allowed = record.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - record.count);
  const resetAt = record.windowStart + windowMs;

  return { allowed, remaining, resetAt };
}

/**
 * Clean up expired rate limit records
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  rateLimitStore.forEach((record, key) => {
    // Remove records older than 1 hour
    if (now - record.windowStart > 3600000) {
      expiredKeys.push(key);
    }
  });

  expiredKeys.forEach((key) => rateLimitStore.delete(key));
}

/**
 * Get rate limit status for identifier
 */
export function getRateLimitStatus(identifier: string): RateLimitRecord | null {
  return rateLimitStore.get(`ratelimit:${identifier}`) || null;
}

/**
 * Reset rate limit for identifier (admin function)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(`ratelimit:${identifier}`);
}

/**
 * Log rate limit violation to database
 */
export async function logRateLimitViolation(
  identifier: string,
  endpoint: string,
  count: number
): Promise<void> {
  try {
    await supabase.from("custody_rate_limits").insert({
      identifier,
      endpoint,
      violation_count: count,
      violated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error logging rate limit violation:", err);
  }
}

/**
 * Get rate limit violations for identifier
 */
export async function getRateLimitViolations(
  identifier: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("custody_rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .order("violated_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching violations:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in getRateLimitViolations:", err);
    return [];
  }
}

/**
 * Check if identifier is blocked due to excessive violations
 */
export async function isIdentifierBlocked(identifier: string): Promise<boolean> {
  try {
    // Get violations in last 24 hours
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    
    const { data, error } = await supabase
      .from("custody_rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .gte("violated_at", oneDayAgo);

    if (error) {
      console.error("Error checking if blocked:", error);
      return false;
    }

    // Block if more than 10 violations in 24 hours
    return (data?.length || 0) > 10;
  } catch (err) {
    console.error("Error in isIdentifierBlocked:", err);
    return false;
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Custody operations (more restrictive)
  "release-funds": { maxRequests: 5, windowMs: 300000 }, // 5 per 5 minutes
  "refund-funds": { maxRequests: 5, windowMs: 300000 },
  "release-milestone": { maxRequests: 10, windowMs: 300000 },
  
  // Balance checks (less restrictive)
  "check-balance": { maxRequests: 60, windowMs: 60000 }, // 60 per minute
  "auto-fund-check": { maxRequests: 30, windowMs: 60000 },
  
  // Statistics (moderate)
  "custody-stats": { maxRequests: 30, windowMs: 60000 },
  "custody-transactions": { maxRequests: 30, windowMs: 60000 },
  
  // Health checks
  "health": { maxRequests: 60, windowMs: 60000 },
};

/**
 * Get rate limit config for endpoint
 */
export function getRateLimitConfig(endpoint: string): {
  maxRequests: number;
  windowMs: number;
} {
  return rateLimitConfigs[endpoint as keyof typeof rateLimitConfigs] || {
    maxRequests: 100,
    windowMs: 60000,
  };
}

/**
 * Middleware helper to apply rate limiting
 */
export async function applyRateLimit(
  identifier: string,
  endpoint: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  headers: Record<string, string>;
}> {
  const config = getRateLimitConfig(endpoint);
  const result = await checkRateLimit(identifier, config.maxRequests, config.windowMs);

  // Log violation if not allowed
  if (!result.allowed) {
    const status = getRateLimitStatus(identifier);
    if (status) {
      await logRateLimitViolation(identifier, endpoint, status.count);
    }
  }

  // Prepare rate limit headers
  const headers = {
    "X-RateLimit-Limit": config.maxRequests.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
  };

  return {
    ...result,
    headers,
  };
}

// Auto cleanup every 10 minutes
if (typeof window === "undefined") {
  setInterval(cleanupRateLimits, 600000);
}

