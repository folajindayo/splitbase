import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum QuotaType {
  REQUESTS = 'requests',
  ESCROWS = 'escrows',
  TRANSACTIONS = 'transactions',
  STORAGE = 'storage',
  BANDWIDTH = 'bandwidth',
  USERS = 'users',
  API_CALLS = 'api_calls',
  WEBHOOKS = 'webhooks',
}

export enum QuotaPeriod {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum PlanTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

export interface QuotaLimit {
  type: QuotaType;
  limit: number;
  period: QuotaPeriod;
  softLimit?: number;
  hardLimit?: number;
  burstLimit?: number;
}

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  description?: string;
  price: {
    amount: number;
    currency: string;
    billingPeriod: 'monthly' | 'yearly';
  };
  quotas: QuotaLimit[];
  features: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserQuota {
  id: string;
  userId: string;
  planId: string;
  type: QuotaType;
  limit: number;
  used: number;
  remaining: number;
  period: QuotaPeriod;
  resetAt: string;
  overage: number;
  warnings: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuotaUsage {
  id: string;
  userId: string;
  type: QuotaType;
  amount: number;
  metadata?: Record<string, any>;
  timestamp: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
}

export interface QuotaStatus {
  type: QuotaType;
  limit: number;
  used: number;
  remaining: number;
  percentage: number;
  resetAt: string;
  exceeded: boolean;
  warnings: QuotaWarning[];
}

export interface QuotaWarning {
  level: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  timestamp: string;
}

export interface OveragePolicy {
  allowed: boolean;
  rate?: number; // Cost per unit over limit
  maxOverage?: number;
  autoUpgrade?: boolean;
  notifyAt?: number[]; // Percentage thresholds
}

export interface QuotaStatistics {
  userId: string;
  period: QuotaPeriod;
  byType: Record<QuotaType, {
    limit: number;
    used: number;
    percentage: number;
  }>;
  totalRequests: number;
  averagePerDay: number;
  peakUsage: {
    timestamp: string;
    count: number;
  };
  timeline: Array<{
    date: string;
    count: number;
  }>;
}

class APIQuotaSystem {
  private static instance: APIQuotaSystem;

  private readonly defaultQuotas: Record<PlanTier, QuotaLimit[]> = {
    [PlanTier.FREE]: [
      { type: QuotaType.REQUESTS, limit: 1000, period: QuotaPeriod.DAY },
      { type: QuotaType.ESCROWS, limit: 5, period: QuotaPeriod.MONTH },
      { type: QuotaType.TRANSACTIONS, limit: 50, period: QuotaPeriod.MONTH },
      { type: QuotaType.STORAGE, limit: 100 * 1024 * 1024, period: QuotaPeriod.MONTH }, // 100MB
      { type: QuotaType.API_CALLS, limit: 10000, period: QuotaPeriod.MONTH },
    ],
    [PlanTier.BASIC]: [
      { type: QuotaType.REQUESTS, limit: 10000, period: QuotaPeriod.DAY },
      { type: QuotaType.ESCROWS, limit: 50, period: QuotaPeriod.MONTH },
      { type: QuotaType.TRANSACTIONS, limit: 500, period: QuotaPeriod.MONTH },
      { type: QuotaType.STORAGE, limit: 1024 * 1024 * 1024, period: QuotaPeriod.MONTH }, // 1GB
      { type: QuotaType.API_CALLS, limit: 100000, period: QuotaPeriod.MONTH },
    ],
    [PlanTier.PRO]: [
      { type: QuotaType.REQUESTS, limit: 100000, period: QuotaPeriod.DAY },
      { type: QuotaType.ESCROWS, limit: 500, period: QuotaPeriod.MONTH },
      { type: QuotaType.TRANSACTIONS, limit: 5000, period: QuotaPeriod.MONTH },
      { type: QuotaType.STORAGE, limit: 10 * 1024 * 1024 * 1024, period: QuotaPeriod.MONTH }, // 10GB
      { type: QuotaType.API_CALLS, limit: 1000000, period: QuotaPeriod.MONTH },
    ],
    [PlanTier.ENTERPRISE]: [
      { type: QuotaType.REQUESTS, limit: 1000000, period: QuotaPeriod.DAY },
      { type: QuotaType.ESCROWS, limit: -1, period: QuotaPeriod.MONTH }, // Unlimited
      { type: QuotaType.TRANSACTIONS, limit: -1, period: QuotaPeriod.MONTH },
      { type: QuotaType.STORAGE, limit: -1, period: QuotaPeriod.MONTH },
      { type: QuotaType.API_CALLS, limit: -1, period: QuotaPeriod.MONTH },
    ],
    [PlanTier.CUSTOM]: [],
  };

  private constructor() {}

  static getInstance(): APIQuotaSystem {
    if (!APIQuotaSystem.instance) {
      APIQuotaSystem.instance = new APIQuotaSystem();
    }
    return APIQuotaSystem.instance;
  }

  // Get user's plan
  async getUserPlan(userId: string): Promise<Plan | null> {
    try {
      const { data, error } = await supabase
        .from('user_plans')
        .select('plan_id')
        .eq('user_id', userId)
        .eq('active', true)
        .single();

      if (error || !data) {
        // Return free plan by default
        return this.getPlanByTier(PlanTier.FREE);
      }

      return this.getPlan(data.plan_id);
    } catch (error) {
      console.error('Failed to get user plan:', error);
      return null;
    }
  }

  // Get plan
  async getPlan(planId: string): Promise<Plan | null> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error || !data) return null;

      return this.mapToPlan(data);
    } catch (error) {
      console.error('Failed to get plan:', error);
      return null;
    }
  }

  // Get plan by tier
  async getPlanByTier(tier: PlanTier): Promise<Plan | null> {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('tier', tier)
        .eq('active', true)
        .single();

      if (error || !data) return null;

      return this.mapToPlan(data);
    } catch (error) {
      console.error('Failed to get plan by tier:', error);
      return null;
    }
  }

  // Check quota
  async checkQuota(userId: string, type: QuotaType, amount: number = 1): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: string;
    message?: string;
  }> {
    try {
      const quota = await this.getUserQuota(userId, type);

      if (!quota) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date().toISOString(),
          message: 'Quota not found',
        };
      }

      // Check if unlimited
      if (quota.limit === -1) {
        return {
          allowed: true,
          remaining: -1,
          resetAt: quota.resetAt,
        };
      }

      const allowed = quota.remaining >= amount;

      if (!allowed) {
        return {
          allowed: false,
          remaining: quota.remaining,
          resetAt: quota.resetAt,
          message: `Quota exceeded. Limit: ${quota.limit}, Used: ${quota.used}`,
        };
      }

      return {
        allowed: true,
        remaining: quota.remaining - amount,
        resetAt: quota.resetAt,
      };
    } catch (error) {
      console.error('Failed to check quota:', error);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date().toISOString(),
        message: 'Error checking quota',
      };
    }
  }

  // Consume quota
  async consumeQuota(
    userId: string,
    type: QuotaType,
    amount: number = 1,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const check = await this.checkQuota(userId, type, amount);

      if (!check.allowed) {
        return false;
      }

      // Update quota usage
      await this.incrementUsage(userId, type, amount);

      // Record usage
      await this.recordUsage(userId, type, amount, metadata);

      // Check for warnings
      const quota = await this.getUserQuota(userId, type);
      if (quota) {
        await this.checkWarningThresholds(quota);
      }

      return true;
    } catch (error) {
      console.error('Failed to consume quota:', error);
      return false;
    }
  }

  // Get user quota
  async getUserQuota(userId: string, type: QuotaType): Promise<UserQuota | null> {
    try {
      // Check if quota needs reset
      const { data, error } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .single();

      if (error || !data) {
        // Initialize quota for user
        return this.initializeQuota(userId, type);
      }

      const quota = this.mapToUserQuota(data);

      // Check if reset needed
      if (new Date(quota.resetAt) <= new Date()) {
        return this.resetQuota(userId, type);
      }

      return quota;
    } catch (error) {
      console.error('Failed to get user quota:', error);
      return null;
    }
  }

  // Get all quotas for user
  async getUserQuotas(userId: string): Promise<UserQuota[]> {
    try {
      const { data, error } = await supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map(this.mapToUserQuota);
    } catch (error) {
      console.error('Failed to get user quotas:', error);
      return [];
    }
  }

  // Get quota status
  async getQuotaStatus(userId: string, type: QuotaType): Promise<QuotaStatus | null> {
    try {
      const quota = await this.getUserQuota(userId, type);

      if (!quota) return null;

      const percentage = quota.limit === -1 ? 0 : (quota.used / quota.limit) * 100;
      const exceeded = quota.limit !== -1 && quota.used >= quota.limit;

      const warnings: QuotaWarning[] = [];

      if (percentage >= 90) {
        warnings.push({
          level: 'critical',
          message: 'Quota usage is at 90% or above',
          threshold: 90,
          timestamp: new Date().toISOString(),
        });
      } else if (percentage >= 75) {
        warnings.push({
          level: 'warning',
          message: 'Quota usage is at 75% or above',
          threshold: 75,
          timestamp: new Date().toISOString(),
        });
      } else if (percentage >= 50) {
        warnings.push({
          level: 'info',
          message: 'Quota usage is at 50% or above',
          threshold: 50,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        type: quota.type,
        limit: quota.limit,
        used: quota.used,
        remaining: quota.remaining,
        percentage,
        resetAt: quota.resetAt,
        exceeded,
        warnings,
      };
    } catch (error) {
      console.error('Failed to get quota status:', error);
      return null;
    }
  }

  // Get quota statistics
  async getStatistics(
    userId: string,
    period: QuotaPeriod = QuotaPeriod.MONTH
  ): Promise<QuotaStatistics | null> {
    try {
      const quotas = await this.getUserQuotas(userId);

      const byType: Record<string, any> = {};
      quotas.forEach((quota) => {
        byType[quota.type] = {
          limit: quota.limit,
          used: quota.used,
          percentage: quota.limit === -1 ? 0 : (quota.used / quota.limit) * 100,
        };
      });

      // Get usage history
      const { data: usageData, error } = await supabase
        .from('quota_usage')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', this.getPeriodStartDate(period))
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const totalRequests = usageData?.length || 0;

      // Calculate average per day
      const daysDiff = Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(this.getPeriodStartDate(period)).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      const averagePerDay = totalRequests / daysDiff;

      // Find peak usage
      const dailyCounts: Record<string, number> = {};
      usageData?.forEach((usage) => {
        const date = usage.timestamp.split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + usage.amount;
      });

      let peakUsage = { timestamp: '', count: 0 };
      Object.entries(dailyCounts).forEach(([date, count]) => {
        if (count > peakUsage.count) {
          peakUsage = { timestamp: date, count };
        }
      });

      // Timeline
      const timeline = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        userId,
        period,
        byType: byType as any,
        totalRequests,
        averagePerDay,
        peakUsage,
        timeline,
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return null;
    }
  }

  // Initialize quota
  private async initializeQuota(userId: string, type: QuotaType): Promise<UserQuota> {
    const plan = await this.getUserPlan(userId);

    if (!plan) {
      throw new Error('User plan not found');
    }

    const quotaLimit = plan.quotas.find((q) => q.type === type);

    if (!quotaLimit) {
      throw new Error(`Quota type ${type} not found in plan`);
    }

    const resetAt = this.calculateResetDate(quotaLimit.period);

    const quotaData = {
      user_id: userId,
      plan_id: plan.id,
      type,
      limit: quotaLimit.limit,
      used: 0,
      remaining: quotaLimit.limit === -1 ? -1 : quotaLimit.limit,
      period: quotaLimit.period,
      reset_at: resetAt.toISOString(),
      overage: 0,
      warnings: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_quotas')
      .insert(quotaData)
      .select()
      .single();

    if (error) throw error;

    return this.mapToUserQuota(data);
  }

  // Reset quota
  private async resetQuota(userId: string, type: QuotaType): Promise<UserQuota> {
    const plan = await this.getUserPlan(userId);

    if (!plan) {
      throw new Error('User plan not found');
    }

    const quotaLimit = plan.quotas.find((q) => q.type === type);

    if (!quotaLimit) {
      throw new Error(`Quota type ${type} not found in plan`);
    }

    const resetAt = this.calculateResetDate(quotaLimit.period);

    const { data, error } = await supabase
      .from('user_quotas')
      .update({
        used: 0,
        remaining: quotaLimit.limit === -1 ? -1 : quotaLimit.limit,
        reset_at: resetAt.toISOString(),
        overage: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('type', type)
      .select()
      .single();

    if (error) throw error;

    return this.mapToUserQuota(data);
  }

  // Increment usage
  private async incrementUsage(
    userId: string,
    type: QuotaType,
    amount: number
  ): Promise<void> {
    await supabase.rpc('increment_quota_usage', {
      p_user_id: userId,
      p_type: type,
      p_amount: amount,
    });
  }

  // Record usage
  private async recordUsage(
    userId: string,
    type: QuotaType,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('quota_usage').insert({
        user_id: userId,
        type,
        amount,
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to record usage:', error);
    }
  }

  // Check warning thresholds
  private async checkWarningThresholds(quota: UserQuota): Promise<void> {
    if (quota.limit === -1) return;

    const percentage = (quota.used / quota.limit) * 100;
    const thresholds = [50, 75, 90, 100];

    for (const threshold of thresholds) {
      if (percentage >= threshold && quota.warnings < threshold) {
        // Send warning notification
        console.log(`Quota warning: ${quota.type} at ${percentage.toFixed(1)}%`);

        // Update warnings
        await supabase
          .from('user_quotas')
          .update({ warnings: threshold })
          .eq('id', quota.id);

        break;
      }
    }
  }

  // Calculate reset date
  private calculateResetDate(period: QuotaPeriod): Date {
    const now = new Date();

    switch (period) {
      case QuotaPeriod.MINUTE:
        return new Date(now.getTime() + 60 * 1000);

      case QuotaPeriod.HOUR:
        return new Date(now.getTime() + 60 * 60 * 1000);

      case QuotaPeriod.DAY:
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;

      case QuotaPeriod.WEEK:
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + (7 - now.getDay()));
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek;

      case QuotaPeriod.MONTH:
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth;

      case QuotaPeriod.YEAR:
        const nextYear = new Date(now.getFullYear() + 1, 0, 1);
        return nextYear;

      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  // Get period start date
  private getPeriodStartDate(period: QuotaPeriod): string {
    const now = new Date();

    switch (period) {
      case QuotaPeriod.DAY:
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();

      case QuotaPeriod.WEEK:
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return weekStart.toISOString();

      case QuotaPeriod.MONTH:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      case QuotaPeriod.YEAR:
        return new Date(now.getFullYear(), 0, 1).toISOString();

      default:
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
    }
  }

  // Map database record to Plan
  private mapToPlan(data: any): Plan {
    return {
      id: data.id,
      name: data.name,
      tier: data.tier,
      description: data.description,
      price: data.price,
      quotas: data.quotas || [],
      features: data.features || [],
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Map database record to UserQuota
  private mapToUserQuota(data: any): UserQuota {
    return {
      id: data.id,
      userId: data.user_id,
      planId: data.plan_id,
      type: data.type,
      limit: data.limit,
      used: data.used,
      remaining: data.remaining,
      period: data.period,
      resetAt: data.reset_at,
      overage: data.overage,
      warnings: data.warnings,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Middleware for API routes
  quotaMiddleware(type: QuotaType = QuotaType.API_CALLS) {
    return async (req: any, res: any, next: any) => {
      if (!req.user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const check = await this.checkQuota(req.user.id, type);

      if (!check.allowed) {
        return res.status(429).json({
          error: 'Quota exceeded',
          resetAt: check.resetAt,
          remaining: check.remaining,
        });
      }

      // Consume quota
      await this.consumeQuota(req.user.id, type, 1, {
        endpoint: req.path,
        method: req.method,
      });

      // Add quota info to response headers
      res.setHeader('X-Quota-Limit', check.remaining + 1);
      res.setHeader('X-Quota-Remaining', check.remaining);
      res.setHeader('X-Quota-Reset', check.resetAt);

      next();
    };
  }
}

// Export singleton instance
export const apiQuotas = APIQuotaSystem.getInstance();

// Convenience functions
export const checkQuota = (userId: string, type: QuotaType, amount?: number) =>
  apiQuotas.checkQuota(userId, type, amount);

export const consumeQuota = (
  userId: string,
  type: QuotaType,
  amount?: number,
  metadata?: Record<string, any>
) => apiQuotas.consumeQuota(userId, type, amount, metadata);

export const getQuotaStatus = (userId: string, type: QuotaType) =>
  apiQuotas.getQuotaStatus(userId, type);

export const getUserPlan = (userId: string) => apiQuotas.getUserPlan(userId);

export const quotaMiddleware = (type?: QuotaType) => apiQuotas.quotaMiddleware(type);

