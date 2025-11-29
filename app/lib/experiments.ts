import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum ExperimentStatus {
  DRAFT = 'draft',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum ExperimentType {
  AB_TEST = 'ab_test',
  MULTIVARIATE = 'multivariate',
  SPLIT_URL = 'split_url',
  PERSONALIZATION = 'personalization',
}

export enum VariantType {
  CONTROL = 'control',
  TREATMENT = 'treatment',
}

export enum GoalType {
  CONVERSION = 'conversion',
  CLICK = 'click',
  PAGE_VIEW = 'page_view',
  FORM_SUBMISSION = 'form_submission',
  PURCHASE = 'purchase',
  SIGNUP = 'signup',
  CUSTOM = 'custom',
}

export enum StatisticalSignificance {
  NOT_SIGNIFICANT = 'not_significant',
  MARGINALLY_SIGNIFICANT = 'marginally_significant',
  SIGNIFICANT = 'significant',
  HIGHLY_SIGNIFICANT = 'highly_significant',
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  type: ExperimentType;
  status: ExperimentStatus;
  hypothesis?: string;
  variants: Variant[];
  goals: Goal[];
  targeting: TargetingRules;
  trafficAllocation: number;
  startDate?: string;
  endDate?: string;
  results?: ExperimentResults;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: string;
  name: string;
  type: VariantType;
  description?: string;
  config: Record<string, any>;
  trafficPercent: number;
  active: boolean;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  description?: string;
  primary: boolean;
  value?: number;
  eventName?: string;
}

export interface TargetingRules {
  countries?: string[];
  devices?: ('desktop' | 'mobile' | 'tablet')[];
  browsers?: string[];
  newUsersOnly?: boolean;
  returnUsersOnly?: boolean;
  customRules?: Array<{
    attribute: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }>;
}

export interface ExperimentAssignment {
  id: string;
  experimentId: string;
  userId: string;
  variantId: string;
  assignedAt: string;
  sticky: boolean;
}

export interface ExperimentEvent {
  id: string;
  experimentId: string;
  variantId: string;
  userId: string;
  goalId: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ExperimentResults {
  startedAt: string;
  completedAt?: string;
  totalParticipants: number;
  variants: Record<string, VariantResults>;
  winner?: {
    variantId: string;
    confidence: number;
    improvement: number;
  };
  statisticalSignificance: StatisticalSignificance;
  recommendations?: string[];
}

export interface VariantResults {
  participants: number;
  conversions: number;
  conversionRate: number;
  averageValue: number;
  totalValue: number;
  standardDeviation: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface ExperimentStatistics {
  totalExperiments: number;
  running: number;
  completed: number;
  averageDuration: number;
  successRate: number;
  byType: Record<ExperimentType, number>;
  recentResults: Array<{
    experimentId: string;
    name: string;
    winner: string;
    improvement: number;
  }>;
}

class ExperimentationSystem {
  private static instance: ExperimentationSystem;
  private assignments: Map<string, Map<string, string>> = new Map(); // experimentId -> userId -> variantId

  private constructor() {}

  static getInstance(): ExperimentationSystem {
    if (!ExperimentationSystem.instance) {
      ExperimentationSystem.instance = new ExperimentationSystem();
    }
    return ExperimentationSystem.instance;
  }

  // Create experiment
  async create(experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Experiment> {
    try {
      // Validate traffic allocation
      const totalTraffic = experiment.variants.reduce((sum, v) => sum + v.trafficPercent, 0);
      if (Math.abs(totalTraffic - 100) > 0.01) {
        throw new Error('Variant traffic percentages must sum to 100');
      }

      const experimentData = {
        name: experiment.name,
        description: experiment.description,
        type: experiment.type,
        status: experiment.status,
        hypothesis: experiment.hypothesis,
        variants: experiment.variants,
        goals: experiment.goals,
        targeting: experiment.targeting,
        traffic_allocation: experiment.trafficAllocation,
        start_date: experiment.startDate,
        end_date: experiment.endDate,
        created_by: experiment.createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('experiments')
        .insert(experimentData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToExperiment(data);
    } catch (error: any) {
      console.error('Failed to create experiment:', error);
      throw error;
    }
  }

  // Get experiment
  async get(experimentId: string): Promise<Experiment | null> {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .select('*')
        .eq('id', experimentId)
        .single();

      if (error || !data) return null;

      return this.mapToExperiment(data);
    } catch (error) {
      console.error('Failed to get experiment:', error);
      return null;
    }
  }

  // List experiments
  async list(filter: {
    status?: ExperimentStatus;
    type?: ExperimentType;
    limit?: number;
  } = {}): Promise<Experiment[]> {
    try {
      let query = supabase.from('experiments').select('*');

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.type) {
        query = query.eq('type', filter.type);
      }

      query = query.order('created_at', { ascending: false });

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToExperiment);
    } catch (error) {
      console.error('Failed to list experiments:', error);
      return [];
    }
  }

  // Start experiment
  async start(experimentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({
          status: ExperimentStatus.RUNNING,
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', experimentId);

      return !error;
    } catch (error) {
      console.error('Failed to start experiment:', error);
      return false;
    }
  }

  // Stop experiment
  async stop(experimentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({
          status: ExperimentStatus.COMPLETED,
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', experimentId);

      return !error;
    } catch (error) {
      console.error('Failed to stop experiment:', error);
      return false;
    }
  }

  // Assign variant to user
  async assignVariant(experimentId: string, userId: string, context?: {
    country?: string;
    device?: string;
    browser?: string;
    isNewUser?: boolean;
  }): Promise<string | null> {
    try {
      // Check if already assigned
      const existing = await this.getAssignment(experimentId, userId);
      if (existing) {
        return existing.variantId;
      }

      const experiment = await this.get(experimentId);

      if (!experiment || experiment.status !== ExperimentStatus.RUNNING) {
        return null;
      }

      // Check targeting rules
      if (!this.matchesTargeting(experiment.targeting, context)) {
        return null;
      }

      // Check traffic allocation
      const random = Math.random() * 100;
      if (random > experiment.trafficAllocation) {
        return null;
      }

      // Select variant based on traffic distribution
      const variantId = this.selectVariant(experiment.variants, userId);

      // Store assignment
      await supabase.from('experiment_assignments').insert({
        experiment_id: experimentId,
        user_id: userId,
        variant_id: variantId,
        assigned_at: new Date().toISOString(),
        sticky: true,
      });

      // Cache assignment
      if (!this.assignments.has(experimentId)) {
        this.assignments.set(experimentId, new Map());
      }
      this.assignments.get(experimentId)!.set(userId, variantId);

      return variantId;
    } catch (error) {
      console.error('Failed to assign variant:', error);
      return null;
    }
  }

  // Get assignment
  async getAssignment(experimentId: string, userId: string): Promise<ExperimentAssignment | null> {
    try {
      // Check cache
      const cached = this.assignments.get(experimentId)?.get(userId);
      if (cached) {
        return {
          id: 'cached',
          experimentId,
          userId,
          variantId: cached,
          assignedAt: new Date().toISOString(),
          sticky: true,
        };
      }

      const { data, error } = await supabase
        .from('experiment_assignments')
        .select('*')
        .eq('experiment_id', experimentId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        experimentId: data.experiment_id,
        userId: data.user_id,
        variantId: data.variant_id,
        assignedAt: data.assigned_at,
        sticky: data.sticky,
      };
    } catch (error) {
      return null;
    }
  }

  // Track goal
  async trackGoal(
    experimentId: string,
    userId: string,
    goalId: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const assignment = await this.getAssignment(experimentId, userId);

      if (!assignment) {
        return false;
      }

      await supabase.from('experiment_events').insert({
        experiment_id: experimentId,
        variant_id: assignment.variantId,
        user_id: userId,
        goal_id: goalId,
        value,
        metadata,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Failed to track goal:', error);
      return false;
    }
  }

  // Get results
  async getResults(experimentId: string): Promise<ExperimentResults | null> {
    try {
      const experiment = await this.get(experimentId);

      if (!experiment) return null;

      // Get all assignments
      const { data: assignments } = await supabase
        .from('experiment_assignments')
        .select('*')
        .eq('experiment_id', experimentId);

      // Get all events
      const { data: events } = await supabase
        .from('experiment_events')
        .select('*')
        .eq('experiment_id', experimentId);

      const variantResults: Record<string, VariantResults> = {};

      experiment.variants.forEach((variant) => {
        const variantAssignments = assignments?.filter(a => a.variant_id === variant.id) || [];
        const variantEvents = events?.filter(e => e.variant_id === variant.id) || [];

        const conversions = new Set(variantEvents.map(e => e.user_id)).size;
        const conversionRate = variantAssignments.length > 0
          ? (conversions / variantAssignments.length) * 100
          : 0;

        const values = variantEvents.map(e => e.value || 0);
        const totalValue = values.reduce((sum, v) => sum + v, 0);
        const averageValue = values.length > 0 ? totalValue / values.length : 0;

        const variance = values.length > 0
          ? values.reduce((sum, v) => sum + Math.pow(v - averageValue, 2), 0) / values.length
          : 0;
        const stdDev = Math.sqrt(variance);

        // Calculate 95% confidence interval
        const z = 1.96; // 95% confidence
        const se = stdDev / Math.sqrt(variantAssignments.length || 1);
        const margin = z * se;

        variantResults[variant.id] = {
          participants: variantAssignments.length,
          conversions,
          conversionRate,
          averageValue,
          totalValue,
          standardDeviation: stdDev,
          confidenceInterval: {
            lower: conversionRate - margin,
            upper: conversionRate + margin,
          },
        };
      });

      // Determine winner
      const controlVariant = experiment.variants.find(v => v.type === VariantType.CONTROL);
      const treatmentVariants = experiment.variants.filter(v => v.type === VariantType.TREATMENT);

      let winner: ExperimentResults['winner'];
      let bestTreatment: { variantId: string; rate: number } | null = null;

      treatmentVariants.forEach((variant) => {
        const rate = variantResults[variant.id]?.conversionRate || 0;
        if (!bestTreatment || rate > bestTreatment.rate) {
          bestTreatment = { variantId: variant.id, rate };
        }
      });

      if (controlVariant && bestTreatment) {
        const controlRate = variantResults[controlVariant.id]?.conversionRate || 0;
        const improvement = ((bestTreatment.rate - controlRate) / controlRate) * 100;

        if (improvement > 0) {
          winner = {
            variantId: bestTreatment.variantId,
            confidence: this.calculateConfidence(
              variantResults[controlVariant.id],
              variantResults[bestTreatment.variantId]
            ),
            improvement,
          };
        }
      }

      const significance = this.determineSignificance(winner?.confidence || 0);

      return {
        startedAt: experiment.startDate || experiment.createdAt,
        completedAt: experiment.endDate,
        totalParticipants: assignments?.length || 0,
        variants: variantResults,
        winner,
        statisticalSignificance: significance,
      };
    } catch (error) {
      console.error('Failed to get results:', error);
      return null;
    }
  }

  // Get statistics
  async getStatistics(): Promise<ExperimentStatistics> {
    try {
      const experiments = await this.list();

      const stats: ExperimentStatistics = {
        totalExperiments: experiments.length,
        running: experiments.filter(e => e.status === ExperimentStatus.RUNNING).length,
        completed: experiments.filter(e => e.status === ExperimentStatus.COMPLETED).length,
        averageDuration: 0,
        successRate: 0,
        byType: {} as Record<ExperimentType, number>,
        recentResults: [],
      };

      experiments.forEach((exp) => {
        stats.byType[exp.type] = (stats.byType[exp.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        totalExperiments: 0,
        running: 0,
        completed: 0,
        averageDuration: 0,
        successRate: 0,
        byType: {} as any,
        recentResults: [],
      };
    }
  }

  // Helper methods
  private matchesTargeting(rules: TargetingRules, context?: any): boolean {
    if (!context) return true;

    if (rules.countries && context.country) {
      if (!rules.countries.includes(context.country)) return false;
    }

    if (rules.devices && context.device) {
      if (!rules.devices.includes(context.device)) return false;
    }

    if (rules.newUsersOnly && !context.isNewUser) return false;
    if (rules.returnUsersOnly && context.isNewUser) return false;

    return true;
  }

  private selectVariant(variants: Variant[], userId: string): string {
    // Use consistent hashing for sticky assignments
    const hash = this.hashUserId(userId);
    const random = (hash % 100) / 100;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.trafficPercent / 100;
      if (random < cumulative) {
        return variant.id;
      }
    }

    return variants[0].id;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private calculateConfidence(control: VariantResults, treatment: VariantResults): number {
    // Simplified z-test for proportions
    const p1 = control.conversionRate / 100;
    const p2 = treatment.conversionRate / 100;
    const n1 = control.participants;
    const n2 = treatment.participants;

    if (n1 === 0 || n2 === 0) return 0;

    const pooled = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pooled * (1 - pooled) * (1/n1 + 1/n2));

    if (se === 0) return 0;

    const z = Math.abs((p2 - p1) / se);

    // Convert z-score to confidence level (rough approximation)
    if (z > 2.58) return 99;
    if (z > 1.96) return 95;
    if (z > 1.64) return 90;
    return Math.min(90, z * 45);
  }

  private determineSignificance(confidence: number): StatisticalSignificance {
    if (confidence >= 99) return StatisticalSignificance.HIGHLY_SIGNIFICANT;
    if (confidence >= 95) return StatisticalSignificance.SIGNIFICANT;
    if (confidence >= 90) return StatisticalSignificance.MARGINALLY_SIGNIFICANT;
    return StatisticalSignificance.NOT_SIGNIFICANT;
  }

  private mapToExperiment(data: any): Experiment {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      status: data.status,
      hypothesis: data.hypothesis,
      variants: data.variants,
      goals: data.goals,
      targeting: data.targeting,
      trafficAllocation: data.traffic_allocation,
      startDate: data.start_date,
      endDate: data.end_date,
      results: data.results,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Export singleton instance
export const experiments = ExperimentationSystem.getInstance();

// Convenience functions
export const createExperiment = (experiment: any) => experiments.create(experiment);
export const getExperiment = (experimentId: string) => experiments.get(experimentId);
export const startExperiment = (experimentId: string) => experiments.start(experimentId);
export const assignVariant = (experimentId: string, userId: string, context?: any) =>
  experiments.assignVariant(experimentId, userId, context);
export const trackExperimentGoal = (experimentId: string, userId: string, goalId: string, value?: number) =>
  experiments.trackGoal(experimentId, userId, goalId, value);
export const getExperimentResults = (experimentId: string) => experiments.getResults(experimentId);


