import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum FeatureFlagType {
  BOOLEAN = 'boolean',
  STRING = 'string',
  NUMBER = 'number',
  JSON = 'json',
  PERCENTAGE = 'percentage',
}

export enum FeatureFlagStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum TargetingRule {
  USER_ID = 'user_id',
  EMAIL = 'email',
  COUNTRY = 'country',
  PLAN = 'plan',
  ROLE = 'role',
  SIGNUP_DATE = 'signup_date',
  CUSTOM = 'custom',
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: FeatureFlagType;
  status: FeatureFlagStatus;
  defaultValue: any;
  rules: TargetingRuleConfig[];
  environments: {
    development?: boolean;
    staging?: boolean;
    production?: boolean;
  };
  rolloutPercentage?: number;
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TargetingRuleConfig {
  id: string;
  name: string;
  type: TargetingRule;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  targetValue: any;
  enabled: boolean;
}

export interface FeatureFlagEvaluation {
  key: string;
  value: any;
  enabled: boolean;
  ruleMatched?: string;
  reason?: string;
}

export interface UserContext {
  userId?: string;
  email?: string;
  country?: string;
  plan?: string;
  role?: string;
  signupDate?: string;
  customAttributes?: Record<string, any>;
}

export interface FeatureFlagUsage {
  flagKey: string;
  userId?: string;
  value: any;
  timestamp: string;
  environment: string;
}

export interface FeatureFlagStats {
  totalFlags: number;
  activeFlags: number;
  inactiveFlags: number;
  byType: Record<FeatureFlagType, number>;
  recentUsage: FeatureFlagUsage[];
}

export interface ConfigSetting {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  category?: string;
  isSecret?: boolean;
  validationRules?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
  updatedBy?: string;
  updatedAt: string;
}

class FeatureFlagsSystem {
  private static instance: FeatureFlagsSystem;
  private cache: Map<string, FeatureFlag> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): FeatureFlagsSystem {
    if (!FeatureFlagsSystem.instance) {
      FeatureFlagsSystem.instance = new FeatureFlagsSystem();
    }
    return FeatureFlagsSystem.instance;
  }

  // Create feature flag
  async create(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureFlag> {
    try {
      const flagData = {
        key: flag.key,
        name: flag.name,
        description: flag.description,
        type: flag.type,
        status: flag.status,
        default_value: flag.defaultValue,
        rules: flag.rules,
        environments: flag.environments,
        rollout_percentage: flag.rolloutPercentage,
        tags: flag.tags,
        created_by: flag.createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('feature_flags')
        .insert(flagData)
        .select()
        .single();

      if (error) throw error;

      const createdFlag = this.mapToFeatureFlag(data);
      this.setCached(createdFlag.key, createdFlag);

      return createdFlag;
    } catch (error: any) {
      console.error('Failed to create feature flag:', error);
      throw error;
    }
  }

  // Get feature flag
  async get(key: string): Promise<FeatureFlag | null> {
    try {
      // Check cache
      const cached = this.getCached(key);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .eq('key', key)
        .single();

      if (error || !data) return null;

      const flag = this.mapToFeatureFlag(data);
      this.setCached(key, flag);

      return flag;
    } catch (error) {
      console.error('Failed to get feature flag:', error);
      return null;
    }
  }

  // List feature flags
  async list(filter: {
    status?: FeatureFlagStatus;
    type?: FeatureFlagType;
    tags?: string[];
    environment?: 'development' | 'staging' | 'production';
  } = {}): Promise<FeatureFlag[]> {
    try {
      let query = supabase.from('feature_flags').select('*');

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.type) {
        query = query.eq('type', filter.type);
      }

      if (filter.tags && filter.tags.length > 0) {
        query = query.contains('tags', filter.tags);
      }

      if (filter.environment) {
        query = query.eq(`environments->${filter.environment}`, true);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToFeatureFlag);
    } catch (error) {
      console.error('Failed to list feature flags:', error);
      return [];
    }
  }

  // Update feature flag
  async update(key: string, updates: Partial<FeatureFlag>): Promise<boolean> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;
      if (updates.defaultValue !== undefined) updateData.default_value = updates.defaultValue;
      if (updates.rules) updateData.rules = updates.rules;
      if (updates.environments) updateData.environments = updates.environments;
      if (updates.rolloutPercentage !== undefined) updateData.rollout_percentage = updates.rolloutPercentage;
      if (updates.tags) updateData.tags = updates.tags;

      const { error } = await supabase
        .from('feature_flags')
        .update(updateData)
        .eq('key', key);

      if (error) throw error;

      // Clear cache
      this.clearCached(key);

      return true;
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      return false;
    }
  }

  // Delete feature flag
  async delete(key: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('key', key);

      if (error) throw error;

      this.clearCached(key);

      return true;
    } catch (error) {
      console.error('Failed to delete feature flag:', error);
      return false;
    }
  }

  // Evaluate feature flag
  async evaluate(key: string, context: UserContext = {}): Promise<FeatureFlagEvaluation> {
    try {
      const flag = await this.get(key);

      if (!flag) {
        return {
          key,
          value: false,
          enabled: false,
          reason: 'Flag not found',
        };
      }

      if (flag.status !== FeatureFlagStatus.ACTIVE) {
        return {
          key,
          value: flag.defaultValue,
          enabled: false,
          reason: 'Flag is not active',
        };
      }

      // Check environment
      const env = process.env.NODE_ENV as 'development' | 'staging' | 'production';
      if (flag.environments[env] === false) {
        return {
          key,
          value: flag.defaultValue,
          enabled: false,
          reason: `Flag disabled in ${env} environment`,
        };
      }

      // Check rollout percentage
      if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
        const userHash = this.hashUserId(context.userId || 'anonymous');
        const percentage = userHash % 100;

        if (percentage >= flag.rolloutPercentage) {
          return {
            key,
            value: flag.defaultValue,
            enabled: false,
            reason: 'User not in rollout percentage',
          };
        }
      }

      // Evaluate rules
      for (const rule of flag.rules) {
        if (!rule.enabled) continue;

        if (this.evaluateRule(rule, context)) {
          // Track usage
          await this.trackUsage(key, context.userId, rule.targetValue, env);

          return {
            key,
            value: rule.targetValue,
            enabled: true,
            ruleMatched: rule.name,
          };
        }
      }

      // Track usage
      await this.trackUsage(key, context.userId, flag.defaultValue, env);

      return {
        key,
        value: flag.defaultValue,
        enabled: true,
        reason: 'Using default value',
      };
    } catch (error) {
      console.error('Failed to evaluate feature flag:', error);
      return {
        key,
        value: false,
        enabled: false,
        reason: 'Evaluation error',
      };
    }
  }

  // Check if feature is enabled
  async isEnabled(key: string, context: UserContext = {}): Promise<boolean> {
    const evaluation = await this.evaluate(key, context);
    return evaluation.enabled && evaluation.value === true;
  }

  // Get feature value
  async getValue<T = any>(key: string, context: UserContext = {}, defaultValue?: T): Promise<T> {
    const evaluation = await this.evaluate(key, context);
    return evaluation.value ?? defaultValue;
  }

  // Evaluate rule
  private evaluateRule(rule: TargetingRuleConfig, context: UserContext): boolean {
    let contextValue: any;

    switch (rule.type) {
      case TargetingRule.USER_ID:
        contextValue = context.userId;
        break;
      case TargetingRule.EMAIL:
        contextValue = context.email;
        break;
      case TargetingRule.COUNTRY:
        contextValue = context.country;
        break;
      case TargetingRule.PLAN:
        contextValue = context.plan;
        break;
      case TargetingRule.ROLE:
        contextValue = context.role;
        break;
      case TargetingRule.SIGNUP_DATE:
        contextValue = context.signupDate;
        break;
      case TargetingRule.CUSTOM:
        contextValue = context.customAttributes?.[rule.value];
        break;
      default:
        return false;
    }

    switch (rule.operator) {
      case 'equals':
        return contextValue === rule.value;
      case 'not_equals':
        return contextValue !== rule.value;
      case 'contains':
        return String(contextValue).includes(String(rule.value));
      case 'not_contains':
        return !String(contextValue).includes(String(rule.value));
      case 'greater_than':
        return Number(contextValue) > Number(rule.value);
      case 'less_than':
        return Number(contextValue) < Number(rule.value);
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(contextValue);
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(contextValue);
      default:
        return false;
    }
  }

  // Hash user ID for consistent rollout
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Track usage
  private async trackUsage(
    flagKey: string,
    userId: string | undefined,
    value: any,
    environment: string
  ): Promise<void> {
    try {
      await supabase.from('feature_flag_usage').insert({
        flag_key: flagKey,
        user_id: userId,
        value,
        environment,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Silently fail usage tracking
    }
  }

  // Get statistics
  async getStats(): Promise<FeatureFlagStats> {
    try {
      const flags = await this.list();

      const stats: FeatureFlagStats = {
        totalFlags: flags.length,
        activeFlags: flags.filter((f) => f.status === FeatureFlagStatus.ACTIVE).length,
        inactiveFlags: flags.filter((f) => f.status === FeatureFlagStatus.INACTIVE).length,
        byType: {} as Record<FeatureFlagType, number>,
        recentUsage: [],
      };

      flags.forEach((flag) => {
        stats.byType[flag.type] = (stats.byType[flag.type] || 0) + 1;
      });

      // Get recent usage
      const { data } = await supabase
        .from('feature_flag_usage')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      stats.recentUsage = (data || []).map((usage) => ({
        flagKey: usage.flag_key,
        userId: usage.user_id,
        value: usage.value,
        timestamp: usage.timestamp,
        environment: usage.environment,
      }));

      return stats;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalFlags: 0,
        activeFlags: 0,
        inactiveFlags: 0,
        byType: {} as any,
        recentUsage: [],
      };
    }
  }

  // Config settings management
  async getConfig(key: string): Promise<ConfigSetting | null> {
    try {
      const { data, error } = await supabase
        .from('config_settings')
        .select('*')
        .eq('key', key)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        key: data.key,
        value: data.value,
        type: data.type,
        description: data.description,
        category: data.category,
        isSecret: data.is_secret,
        validationRules: data.validation_rules,
        updatedBy: data.updated_by,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Failed to get config:', error);
      return null;
    }
  }

  // Set config
  async setConfig(setting: Omit<ConfigSetting, 'id' | 'updatedAt'>): Promise<boolean> {
    try {
      // Validate value
      if (setting.validationRules) {
        const valid = this.validateConfigValue(setting.value, setting.validationRules);
        if (!valid) {
          throw new Error('Config value validation failed');
        }
      }

      const { error } = await supabase
        .from('config_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          type: setting.type,
          description: setting.description,
          category: setting.category,
          is_secret: setting.isSecret,
          validation_rules: setting.validationRules,
          updated_by: setting.updatedBy,
          updated_at: new Date().toISOString(),
        });

      return !error;
    } catch (error) {
      console.error('Failed to set config:', error);
      return false;
    }
  }

  // Get all configs
  async getAllConfigs(category?: string): Promise<ConfigSetting[]> {
    try {
      let query = supabase.from('config_settings').select('*');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((setting) => ({
        id: setting.id,
        key: setting.key,
        value: setting.is_secret ? '***' : setting.value,
        type: setting.type,
        description: setting.description,
        category: setting.category,
        isSecret: setting.is_secret,
        validationRules: setting.validation_rules,
        updatedBy: setting.updated_by,
        updatedAt: setting.updated_at,
      }));
    } catch (error) {
      console.error('Failed to get all configs:', error);
      return [];
    }
  }

  // Validate config value
  private validateConfigValue(value: any, rules: ConfigSetting['validationRules']): boolean {
    if (!rules) return true;

    if (rules.min !== undefined && value < rules.min) return false;
    if (rules.max !== undefined && value > rules.max) return false;
    if (rules.pattern && !new RegExp(rules.pattern).test(String(value))) return false;
    if (rules.enum && !rules.enum.includes(value)) return false;

    return true;
  }

  // Cache management
  private getCached(key: string): FeatureFlag | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && expiry > Date.now()) {
      return this.cache.get(key) || null;
    }
    this.clearCached(key);
    return null;
  }

  private setCached(key: string, flag: FeatureFlag): void {
    this.cache.set(key, flag);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  private clearCached(key: string): void {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Map database record to FeatureFlag
  private mapToFeatureFlag(data: any): FeatureFlag {
    return {
      id: data.id,
      key: data.key,
      name: data.name,
      description: data.description,
      type: data.type,
      status: data.status,
      defaultValue: data.default_value,
      rules: data.rules || [],
      environments: data.environments || {},
      rolloutPercentage: data.rollout_percentage,
      tags: data.tags || [],
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagsSystem.getInstance();

// Convenience functions
export const isFeatureEnabled = (key: string, context?: UserContext) =>
  featureFlags.isEnabled(key, context);

export const getFeatureValue = <T = any>(key: string, context?: UserContext, defaultValue?: T) =>
  featureFlags.getValue<T>(key, context, defaultValue);

export const evaluateFeature = (key: string, context?: UserContext) =>
  featureFlags.evaluate(key, context);

export const getConfig = (key: string) => featureFlags.getConfig(key);

export const setConfig = (setting: any) => featureFlags.setConfig(setting);

