import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum FraudRuleType {
  VELOCITY = 'velocity',
  AMOUNT_THRESHOLD = 'amount_threshold',
  LOCATION = 'location',
  DEVICE = 'device',
  BEHAVIOR = 'behavior',
  BLACKLIST = 'blacklist',
  PATTERN = 'pattern',
  ML_MODEL = 'ml_model',
}

export enum ActionType {
  ALLOW = 'allow',
  FLAG = 'flag',
  REVIEW = 'review',
  BLOCK = 'block',
  CHALLENGE = 'challenge',
}

export enum AlertStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  CONFIRMED = 'confirmed',
}

export interface FraudRule {
  id: string;
  name: string;
  type: FraudRuleType;
  description?: string;
  conditions: FraudCondition[];
  action: ActionType;
  riskScore: number;
  enabled: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface FraudCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
  timeWindow?: number; // in minutes
}

export interface RiskAssessment {
  id: string;
  userId: string;
  transactionId?: string;
  riskLevel: RiskLevel;
  riskScore: number;
  factors: RiskFactor[];
  triggeredRules: string[];
  recommendation: ActionType;
  metadata?: Record<string, any>;
  assessedAt: string;
}

export interface RiskFactor {
  type: string;
  score: number;
  weight: number;
  description: string;
  evidence?: Record<string, any>;
}

export interface FraudAlert {
  id: string;
  userId: string;
  transactionId?: string;
  assessmentId: string;
  riskLevel: RiskLevel;
  status: AlertStatus;
  description: string;
  triggeredRules: string[];
  assignedTo?: string;
  resolvedAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRiskProfile {
  userId: string;
  overallRiskScore: number;
  riskLevel: RiskLevel;
  flags: string[];
  trustScore: number;
  accountAge: number;
  transactionCount: number;
  totalVolume: number;
  successRate: number;
  disputeRate: number;
  chargebackRate: number;
  lastAssessment: string;
  history: Array<{
    date: string;
    riskScore: number;
    event: string;
  }>;
}

export interface BlacklistEntry {
  id: string;
  type: 'email' | 'ip' | 'device' | 'card' | 'phone';
  value: string;
  reason: string;
  addedBy: string;
  expiresAt?: string;
  createdAt: string;
}

export interface VelocityCheck {
  userId: string;
  action: string;
  count: number;
  timeWindow: number;
  threshold: number;
  exceeded: boolean;
}

export interface FraudStatistics {
  totalAssessments: number;
  byRiskLevel: Record<RiskLevel, number>;
  byAction: Record<ActionType, number>;
  alertsByStatus: Record<AlertStatus, number>;
  detectionRate: number;
  falsePositiveRate: number;
  averageResolutionTime: number;
  topRules: Array<{
    ruleId: string;
    name: string;
    triggerCount: number;
  }>;
  trends: Array<{
    date: string;
    assessments: number;
    blocked: number;
    flagged: number;
  }>;
}

class FraudDetectionSystem {
  private static instance: FraudDetectionSystem;
  private rules: Map<string, FraudRule> = new Map();
  private blacklist: Map<string, Set<string>> = new Map();

  private constructor() {
    this.loadRules();
    this.loadBlacklist();
  }

  static getInstance(): FraudDetectionSystem {
    if (!FraudDetectionSystem.instance) {
      FraudDetectionSystem.instance = new FraudDetectionSystem();
    }
    return FraudDetectionSystem.instance;
  }

  // Assess risk
  async assessRisk(
    userId: string,
    transactionId?: string,
    context?: Record<string, any>
  ): Promise<RiskAssessment> {
    try {
      const factors: RiskFactor[] = [];
      const triggeredRules: string[] = [];

      // Get user profile
      const profile = await this.getUserRiskProfile(userId);

      // Check blacklist
      const blacklistFactor = await this.checkBlacklist(userId, context);
      if (blacklistFactor) {
        factors.push(blacklistFactor);
      }

      // Check velocity
      const velocityFactor = await this.checkVelocity(userId, context);
      if (velocityFactor) {
        factors.push(velocityFactor);
      }

      // Check location
      const locationFactor = await this.checkLocation(userId, context);
      if (locationFactor) {
        factors.push(locationFactor);
      }

      // Check device
      const deviceFactor = await this.checkDevice(userId, context);
      if (deviceFactor) {
        factors.push(deviceFactor);
      }

      // Check behavior patterns
      const behaviorFactor = await this.checkBehavior(userId, context);
      if (behaviorFactor) {
        factors.push(behaviorFactor);
      }

      // Check amount
      if (context?.amount) {
        const amountFactor = await this.checkAmount(userId, context.amount);
        if (amountFactor) {
          factors.push(amountFactor);
        }
      }

      // Apply rules
      for (const rule of this.rules.values()) {
        if (!rule.enabled) continue;

        if (this.evaluateRule(rule, { userId, profile, context, factors })) {
          triggeredRules.push(rule.id);
          factors.push({
            type: rule.type,
            score: rule.riskScore,
            weight: rule.priority / 10,
            description: rule.name,
          });
        }
      }

      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(factors);
      const riskLevel = this.determineRiskLevel(riskScore);
      const recommendation = this.getRecommendation(riskLevel, triggeredRules);

      const assessment: RiskAssessment = {
        id: crypto.randomUUID(),
        userId,
        transactionId,
        riskLevel,
        riskScore,
        factors,
        triggeredRules,
        recommendation,
        metadata: context,
        assessedAt: new Date().toISOString(),
      };

      // Store assessment
      await this.storeAssessment(assessment);

      // Create alert if high risk
      if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
        await this.createAlert(assessment);
      }

      return assessment;
    } catch (error: any) {
      console.error('Failed to assess risk:', error);
      throw error;
    }
  }

  // Get user risk profile
  async getUserRiskProfile(userId: string): Promise<UserRiskProfile> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      const { data: assessments } = await supabase
        .from('risk_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('assessed_at', { ascending: false })
        .limit(100);

      const accountAge = user?.created_at
        ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const transactionCount = transactions?.length || 0;
      const totalVolume = transactions?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

      const successfulTransactions = transactions?.filter((t: any) => t.status === 'completed').length || 0;
      const successRate = transactionCount > 0 ? (successfulTransactions / transactionCount) * 100 : 100;

      const disputes = transactions?.filter((t: any) => t.disputed).length || 0;
      const disputeRate = transactionCount > 0 ? (disputes / transactionCount) * 100 : 0;

      const chargebacks = transactions?.filter((t: any) => t.chargeback).length || 0;
      const chargebackRate = transactionCount > 0 ? (chargebacks / transactionCount) * 100 : 0;

      const recentAssessments = assessments?.slice(0, 10) || [];
      const avgRiskScore = recentAssessments.length > 0
        ? recentAssessments.reduce((sum: number, a: any) => sum + a.risk_score, 0) / recentAssessments.length
        : 0;

      const flags: string[] = [];
      if (disputeRate > 5) flags.push('high_dispute_rate');
      if (chargebackRate > 2) flags.push('high_chargeback_rate');
      if (avgRiskScore > 70) flags.push('high_average_risk');

      const trustScore = Math.max(0, 100 - avgRiskScore - (disputeRate * 2) - (chargebackRate * 5));
      const overallRiskScore = Math.min(100, avgRiskScore + (disputeRate * 2) + (chargebackRate * 5));

      return {
        userId,
        overallRiskScore,
        riskLevel: this.determineRiskLevel(overallRiskScore),
        flags,
        trustScore,
        accountAge,
        transactionCount,
        totalVolume,
        successRate,
        disputeRate,
        chargebackRate,
        lastAssessment: assessments?.[0]?.assessed_at || new Date().toISOString(),
        history: recentAssessments.map((a: any) => ({
          date: a.assessed_at,
          riskScore: a.risk_score,
          event: a.metadata?.event || 'assessment',
        })),
      };
    } catch (error) {
      console.error('Failed to get user risk profile:', error);
      return {
        userId,
        overallRiskScore: 50,
        riskLevel: RiskLevel.MEDIUM,
        flags: [],
        trustScore: 50,
        accountAge: 0,
        transactionCount: 0,
        totalVolume: 0,
        successRate: 0,
        disputeRate: 0,
        chargebackRate: 0,
        lastAssessment: new Date().toISOString(),
        history: [],
      };
    }
  }

  // Check blacklist
  async checkBlacklist(userId: string, context?: Record<string, any>): Promise<RiskFactor | null> {
    try {
      const checks = [
        { type: 'email', value: context?.email },
        { type: 'ip', value: context?.ip },
        { type: 'device', value: context?.deviceId },
        { type: 'phone', value: context?.phone },
      ];

      for (const check of checks) {
        if (!check.value) continue;

        const blacklisted = this.blacklist.get(check.type)?.has(check.value);

        if (blacklisted) {
          return {
            type: 'blacklist',
            score: 100,
            weight: 1,
            description: `${check.type} is blacklisted`,
            evidence: { type: check.type, value: check.value },
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Check velocity
  async checkVelocity(userId: string, context?: Record<string, any>): Promise<RiskFactor | null> {
    try {
      const timeWindows = [
        { window: 5, threshold: 5, name: '5 minutes' },
        { window: 60, threshold: 20, name: '1 hour' },
        { window: 1440, threshold: 50, name: '24 hours' },
      ];

      for (const { window, threshold, name } of timeWindows) {
        const count = await this.getActionCount(userId, context?.action || 'transaction', window);

        if (count > threshold) {
          return {
            type: 'velocity',
            score: Math.min(100, (count / threshold) * 50),
            weight: 0.8,
            description: `High velocity: ${count} actions in ${name}`,
            evidence: { window, count, threshold },
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Check location
  async checkLocation(userId: string, context?: Record<string, any>): Promise<RiskFactor | null> {
    try {
      if (!context?.country || !context?.ip) return null;

      // Get recent transactions
      const { data: recentTx } = await supabase
        .from('transactions')
        .select('metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!recentTx || recentTx.length === 0) return null;

      const recentCountries = recentTx
        .map((tx: any) => tx.metadata?.country)
        .filter(Boolean);

      // Check for country change
      if (recentCountries.length > 0 && !recentCountries.includes(context.country)) {
        return {
          type: 'location',
          score: 40,
          weight: 0.6,
          description: 'Transaction from new country',
          evidence: { 
            current: context.country,
            recent: recentCountries[0],
          },
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Check device
  async checkDevice(userId: string, context?: Record<string, any>): Promise<RiskFactor | null> {
    try {
      if (!context?.deviceId) return null;

      const { data: devices } = await supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_id', context.deviceId)
        .single();

      if (!devices) {
        return {
          type: 'device',
          score: 30,
          weight: 0.5,
          description: 'New device detected',
          evidence: { deviceId: context.deviceId },
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Check behavior
  async checkBehavior(userId: string, context?: Record<string, any>): Promise<RiskFactor | null> {
    try {
      // Check for unusual patterns
      const patterns: string[] = [];

      // Time-based patterns
      const hour = new Date().getHours();
      if (hour >= 1 && hour <= 5) {
        patterns.push('unusual_time');
      }

      // Amount patterns
      if (context?.amount) {
        const { data: avgAmount } = await supabase
          .rpc('get_average_transaction_amount', { user_id_param: userId });

        if (avgAmount && context.amount > avgAmount * 3) {
          patterns.push('unusual_amount');
        }
      }

      if (patterns.length > 0) {
        return {
          type: 'behavior',
          score: patterns.length * 20,
          weight: 0.7,
          description: 'Unusual behavior patterns detected',
          evidence: { patterns },
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Check amount
  async checkAmount(userId: string, amount: number): Promise<RiskFactor | null> {
    try {
      // High amount threshold
      if (amount > 10000) {
        return {
          type: 'amount',
          score: Math.min(100, (amount / 10000) * 30),
          weight: 0.6,
          description: 'High transaction amount',
          evidence: { amount },
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Create fraud rule
  async createRule(rule: Omit<FraudRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<FraudRule> {
    try {
      const ruleData = {
        name: rule.name,
        type: rule.type,
        description: rule.description,
        conditions: rule.conditions,
        action: rule.action,
        risk_score: rule.riskScore,
        enabled: rule.enabled,
        priority: rule.priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('fraud_rules')
        .insert(ruleData)
        .select()
        .single();

      if (error) throw error;

      const newRule = this.mapToRule(data);
      this.rules.set(newRule.id, newRule);

      return newRule;
    } catch (error: any) {
      console.error('Failed to create rule:', error);
      throw error;
    }
  }

  // Add to blacklist
  async addToBlacklist(entry: Omit<BlacklistEntry, 'id' | 'createdAt'>): Promise<BlacklistEntry> {
    try {
      const entryData = {
        type: entry.type,
        value: entry.value,
        reason: entry.reason,
        added_by: entry.addedBy,
        expires_at: entry.expiresAt,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('blacklist')
        .insert(entryData)
        .select()
        .single();

      if (error) throw error;

      // Update cache
      if (!this.blacklist.has(entry.type)) {
        this.blacklist.set(entry.type, new Set());
      }
      this.blacklist.get(entry.type)!.add(entry.value);

      return this.mapToBlacklistEntry(data);
    } catch (error: any) {
      console.error('Failed to add to blacklist:', error);
      throw error;
    }
  }

  // Create alert
  async createAlert(assessment: RiskAssessment): Promise<FraudAlert> {
    try {
      const alertData = {
        user_id: assessment.userId,
        transaction_id: assessment.transactionId,
        assessment_id: assessment.id,
        risk_level: assessment.riskLevel,
        status: AlertStatus.OPEN,
        description: `High risk activity detected: ${assessment.factors.map(f => f.description).join(', ')}`,
        triggered_rules: assessment.triggeredRules,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('fraud_alerts')
        .insert(alertData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToAlert(data);
    } catch (error: any) {
      console.error('Failed to create alert:', error);
      throw error;
    }
  }

  // Get alerts
  async getAlerts(filter: { status?: AlertStatus; userId?: string }): Promise<FraudAlert[]> {
    try {
      let query = supabase.from('fraud_alerts').select('*');

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToAlert);
    } catch (error) {
      console.error('Failed to get alerts:', error);
      return [];
    }
  }

  // Get statistics
  async getStatistics(days: number = 30): Promise<FraudStatistics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: assessments } = await supabase
        .from('risk_assessments')
        .select('*')
        .gte('assessed_at', startDate.toISOString());

      const { data: alerts } = await supabase
        .from('fraud_alerts')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const byRiskLevel: Record<RiskLevel, number> = {
        [RiskLevel.LOW]: 0,
        [RiskLevel.MEDIUM]: 0,
        [RiskLevel.HIGH]: 0,
        [RiskLevel.CRITICAL]: 0,
      };

      const byAction: Record<ActionType, number> = {
        [ActionType.ALLOW]: 0,
        [ActionType.FLAG]: 0,
        [ActionType.REVIEW]: 0,
        [ActionType.BLOCK]: 0,
        [ActionType.CHALLENGE]: 0,
      };

      assessments?.forEach((a: any) => {
        byRiskLevel[a.risk_level as RiskLevel]++;
        byAction[a.recommendation as ActionType]++;
      });

      const alertsByStatus: Record<AlertStatus, number> = {
        [AlertStatus.OPEN]: 0,
        [AlertStatus.INVESTIGATING]: 0,
        [AlertStatus.RESOLVED]: 0,
        [AlertStatus.FALSE_POSITIVE]: 0,
        [AlertStatus.CONFIRMED]: 0,
      };

      alerts?.forEach((a: any) => {
        alertsByStatus[a.status as AlertStatus]++;
      });

      const confirmedFraud = alerts?.filter((a: any) => a.status === AlertStatus.CONFIRMED).length || 0;
      const falsePositives = alerts?.filter((a: any) => a.status === AlertStatus.FALSE_POSITIVE).length || 0;

      return {
        totalAssessments: assessments?.length || 0,
        byRiskLevel,
        byAction,
        alertsByStatus,
        detectionRate: assessments?.length ? (confirmedFraud / assessments.length) * 100 : 0,
        falsePositiveRate: alerts?.length ? (falsePositives / alerts.length) * 100 : 0,
        averageResolutionTime: 0,
        topRules: [],
        trends: [],
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        totalAssessments: 0,
        byRiskLevel: {} as any,
        byAction: {} as any,
        alertsByStatus: {} as any,
        detectionRate: 0,
        falsePositiveRate: 0,
        averageResolutionTime: 0,
        topRules: [],
        trends: [],
      };
    }
  }

  // Helper methods
  private async loadRules(): Promise<void> {
    try {
      const { data } = await supabase.from('fraud_rules').select('*').eq('enabled', true);

      if (data) {
        data.forEach((rule: any) => {
          this.rules.set(rule.id, this.mapToRule(rule));
        });
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  }

  private async loadBlacklist(): Promise<void> {
    try {
      const { data } = await supabase.from('blacklist').select('*');

      if (data) {
        data.forEach((entry: any) => {
          if (!this.blacklist.has(entry.type)) {
            this.blacklist.set(entry.type, new Set());
          }
          this.blacklist.get(entry.type)!.add(entry.value);
        });
      }
    } catch (error) {
      console.error('Failed to load blacklist:', error);
    }
  }

  private evaluateRule(rule: FraudRule, context: any): boolean {
    return rule.conditions.every(condition => 
      this.evaluateCondition(condition, context)
    );
  }

  private evaluateCondition(condition: FraudCondition, context: any): boolean {
    const value = this.getNestedValue(context, condition.field);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'contains':
        return String(value).includes(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  private calculateRiskScore(factors: RiskFactor[]): number {
    if (factors.length === 0) return 0;

    const weightedSum = factors.reduce((sum, f) => sum + (f.score * f.weight), 0);
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);

    return Math.min(100, Math.round(weightedSum / (totalWeight || 1)));
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 30) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private getRecommendation(riskLevel: RiskLevel, triggeredRules: string[]): ActionType {
    if (riskLevel === RiskLevel.CRITICAL) return ActionType.BLOCK;
    if (riskLevel === RiskLevel.HIGH) return ActionType.REVIEW;
    if (riskLevel === RiskLevel.MEDIUM) return ActionType.FLAG;
    return ActionType.ALLOW;
  }

  private async storeAssessment(assessment: RiskAssessment): Promise<void> {
    try {
      await supabase.from('risk_assessments').insert({
        id: assessment.id,
        user_id: assessment.userId,
        transaction_id: assessment.transactionId,
        risk_level: assessment.riskLevel,
        risk_score: assessment.riskScore,
        factors: assessment.factors,
        triggered_rules: assessment.triggeredRules,
        recommendation: assessment.recommendation,
        metadata: assessment.metadata,
        assessed_at: assessment.assessedAt,
      });
    } catch (error) {
      console.error('Failed to store assessment:', error);
    }
  }

  private async getActionCount(userId: string, action: string, windowMinutes: number): Promise<number> {
    try {
      const startTime = new Date();
      startTime.setMinutes(startTime.getMinutes() - windowMinutes);

      const { count } = await supabase
        .from('user_actions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('action', action)
        .gte('timestamp', startTime.toISOString());

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  private mapToRule(data: any): FraudRule {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      description: data.description,
      conditions: data.conditions,
      action: data.action,
      riskScore: data.risk_score,
      enabled: data.enabled,
      priority: data.priority,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToAlert(data: any): FraudAlert {
    return {
      id: data.id,
      userId: data.user_id,
      transactionId: data.transaction_id,
      assessmentId: data.assessment_id,
      riskLevel: data.risk_level,
      status: data.status,
      description: data.description,
      triggeredRules: data.triggered_rules,
      assignedTo: data.assigned_to,
      resolvedAt: data.resolved_at,
      resolution: data.resolution,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToBlacklistEntry(data: any): BlacklistEntry {
    return {
      id: data.id,
      type: data.type,
      value: data.value,
      reason: data.reason,
      addedBy: data.added_by,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
    };
  }
}

// Export singleton instance
export const fraudDetection = FraudDetectionSystem.getInstance();

// Convenience functions
export const assessUserRisk = (userId: string, transactionId?: string, context?: any) =>
  fraudDetection.assessRisk(userId, transactionId, context);
export const getUserRiskProfile = (userId: string) => fraudDetection.getUserRiskProfile(userId);
export const createFraudRule = (rule: any) => fraudDetection.createRule(rule);
export const addToBlacklist = (entry: any) => fraudDetection.addToBlacklist(entry);
export const getFraudAlerts = (filter: any) => fraudDetection.getAlerts(filter);
export const getFraudStatistics = (days?: number) => fraudDetection.getStatistics(days);

