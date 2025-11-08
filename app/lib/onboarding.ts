import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export enum StepType {
  PROFILE_SETUP = 'profile_setup',
  KYC_VERIFICATION = 'kyc_verification',
  PAYMENT_METHOD = 'payment_method',
  PREFERENCES = 'preferences',
  TUTORIAL = 'tutorial',
  WELCOME_MESSAGE = 'welcome_message',
  FEATURE_TOUR = 'feature_tour',
  CUSTOM = 'custom',
}

export enum TourType {
  PRODUCT = 'product',
  FEATURE = 'feature',
  ONBOARDING = 'onboarding',
  UPDATE = 'update',
}

export enum StepStatus {
  LOCKED = 'locked',
  AVAILABLE = 'available',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export interface OnboardingFlow {
  id: string;
  name: string;
  description?: string;
  steps: OnboardingStep[];
  optional: boolean;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingStep {
  id: string;
  flowId: string;
  type: StepType;
  title: string;
  description?: string;
  content?: string;
  action?: {
    type: 'redirect' | 'modal' | 'api_call' | 'form';
    config: Record<string, any>;
  };
  order: number;
  required: boolean;
  estimatedTime?: number;
  dependencies?: string[];
  validation?: {
    rules: Array<{
      field: string;
      condition: string;
    }>;
  };
}

export interface UserOnboarding {
  id: string;
  userId: string;
  flowId: string;
  status: OnboardingStatus;
  currentStep?: string;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface Tour {
  id: string;
  name: string;
  type: TourType;
  description?: string;
  steps: TourStep[];
  targeting: TourTargeting;
  active: boolean;
  priority: number;
  createdAt: string;
}

export interface TourStep {
  id: string;
  element: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  highlightElement?: boolean;
  action?: {
    type: 'next' | 'dismiss' | 'custom';
    label: string;
    handler?: string;
  };
  order: number;
}

export interface TourTargeting {
  userSegments?: string[];
  roles?: string[];
  minDaysSinceSignup?: number;
  maxDaysSinceSignup?: number;
  features?: string[];
  showOnce?: boolean;
  url?: string;
}

export interface UserProgress {
  userId: string;
  flows: Array<{
    flowId: string;
    status: OnboardingStatus;
    progress: number;
    completedSteps: number;
    totalSteps: number;
  }>;
  tours: Array<{
    tourId: string;
    viewed: boolean;
    completed: boolean;
    lastViewedAt?: string;
  }>;
  overallProgress: number;
}

export interface OnboardingAnalytics {
  totalUsers: number;
  completed: number;
  inProgress: number;
  completionRate: number;
  averageTimeToComplete: number;
  dropoffByStep: Record<string, number>;
  popularSkips: Array<{
    stepId: string;
    count: number;
  }>;
}

class OnboardingSystem {
  private static instance: OnboardingSystem;

  private constructor() {}

  static getInstance(): OnboardingSystem {
    if (!OnboardingSystem.instance) {
      OnboardingSystem.instance = new OnboardingSystem();
    }
    return OnboardingSystem.instance;
  }

  // Create onboarding flow
  async createFlow(flow: Omit<OnboardingFlow, 'id' | 'createdAt' | 'updatedAt'>): Promise<OnboardingFlow> {
    try {
      const flowData = {
        name: flow.name,
        description: flow.description,
        steps: flow.steps,
        optional: flow.optional,
        order: flow.order,
        active: flow.active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('onboarding_flows')
        .insert(flowData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToFlow(data);
    } catch (error: any) {
      console.error('Failed to create onboarding flow:', error);
      throw error;
    }
  }

  // Get flow
  async getFlow(flowId: string): Promise<OnboardingFlow | null> {
    try {
      const { data, error } = await supabase
        .from('onboarding_flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (error || !data) return null;

      return this.mapToFlow(data);
    } catch (error) {
      console.error('Failed to get flow:', error);
      return null;
    }
  }

  // List flows
  async listFlows(activeOnly: boolean = true): Promise<OnboardingFlow[]> {
    try {
      let query = supabase.from('onboarding_flows').select('*');

      if (activeOnly) {
        query = query.eq('active', true);
      }

      query = query.order('order', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToFlow);
    } catch (error) {
      console.error('Failed to list flows:', error);
      return [];
    }
  }

  // Start onboarding
  async startOnboarding(userId: string, flowId: string): Promise<UserOnboarding> {
    try {
      const flow = await this.getFlow(flowId);

      if (!flow) {
        throw new Error('Flow not found');
      }

      const onboardingData = {
        user_id: userId,
        flow_id: flowId,
        status: OnboardingStatus.IN_PROGRESS,
        current_step: flow.steps[0]?.id,
        completed_steps: [],
        skipped_steps: [],
        started_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_onboarding')
        .insert(onboardingData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToUserOnboarding(data);
    } catch (error: any) {
      console.error('Failed to start onboarding:', error);
      throw error;
    }
  }

  // Get user onboarding
  async getUserOnboarding(userId: string, flowId: string): Promise<UserOnboarding | null> {
    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', userId)
        .eq('flow_id', flowId)
        .single();

      if (error || !data) return null;

      return this.mapToUserOnboarding(data);
    } catch (error) {
      return null;
    }
  }

  // Complete step
  async completeStep(userId: string, flowId: string, stepId: string): Promise<boolean> {
    try {
      const onboarding = await this.getUserOnboarding(userId, flowId);

      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      const flow = await this.getFlow(flowId);

      if (!flow) {
        throw new Error('Flow not found');
      }

      const completedSteps = [...onboarding.completedSteps, stepId];
      const currentStepIndex = flow.steps.findIndex(s => s.id === stepId);
      const nextStep = flow.steps[currentStepIndex + 1];

      const updates: any = {
        completed_steps: completedSteps,
        current_step: nextStep?.id || null,
        updated_at: new Date().toISOString(),
      };

      // Check if all required steps are completed
      const requiredSteps = flow.steps.filter(s => s.required);
      const allRequiredCompleted = requiredSteps.every(s => 
        completedSteps.includes(s.id)
      );

      if (allRequiredCompleted) {
        updates.status = OnboardingStatus.COMPLETED;
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_onboarding')
        .update(updates)
        .eq('user_id', userId)
        .eq('flow_id', flowId);

      if (error) throw error;

      // Track completion event
      await this.trackEvent(userId, flowId, stepId, 'step_completed');

      return true;
    } catch (error) {
      console.error('Failed to complete step:', error);
      return false;
    }
  }

  // Skip step
  async skipStep(userId: string, flowId: string, stepId: string): Promise<boolean> {
    try {
      const onboarding = await this.getUserOnboarding(userId, flowId);

      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      const flow = await this.getFlow(flowId);

      if (!flow) {
        throw new Error('Flow not found');
      }

      const step = flow.steps.find(s => s.id === stepId);

      if (step?.required) {
        throw new Error('Cannot skip required step');
      }

      const skippedSteps = [...onboarding.skippedSteps, stepId];
      const currentStepIndex = flow.steps.findIndex(s => s.id === stepId);
      const nextStep = flow.steps[currentStepIndex + 1];

      const { error } = await supabase
        .from('user_onboarding')
        .update({
          skipped_steps: skippedSteps,
          current_step: nextStep?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('flow_id', flowId);

      if (error) throw error;

      await this.trackEvent(userId, flowId, stepId, 'step_skipped');

      return true;
    } catch (error) {
      console.error('Failed to skip step:', error);
      return false;
    }
  }

  // Get user progress
  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      const flows = await this.listFlows();
      const { data: userOnboarding } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', userId);

      const flowProgress = flows.map((flow) => {
        const userFlow = userOnboarding?.find(uo => uo.flow_id === flow.id);
        const totalSteps = flow.steps.length;
        const completedSteps = userFlow?.completed_steps?.length || 0;
        const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

        return {
          flowId: flow.id,
          status: userFlow?.status || OnboardingStatus.NOT_STARTED,
          progress,
          completedSteps,
          totalSteps,
        };
      });

      const { data: tourViews } = await supabase
        .from('tour_views')
        .select('*')
        .eq('user_id', userId);

      const tourProgress = (tourViews || []).map((view: any) => ({
        tourId: view.tour_id,
        viewed: true,
        completed: view.completed,
        lastViewedAt: view.viewed_at,
      }));

      const totalProgress = flowProgress.reduce((sum, f) => sum + f.progress, 0);
      const overallProgress = flows.length > 0 ? totalProgress / flows.length : 0;

      return {
        userId,
        flows: flowProgress,
        tours: tourProgress,
        overallProgress,
      };
    } catch (error) {
      console.error('Failed to get user progress:', error);
      return {
        userId,
        flows: [],
        tours: [],
        overallProgress: 0,
      };
    }
  }

  // Create tour
  async createTour(tour: Omit<Tour, 'id' | 'createdAt'>): Promise<Tour> {
    try {
      const tourData = {
        name: tour.name,
        type: tour.type,
        description: tour.description,
        steps: tour.steps,
        targeting: tour.targeting,
        active: tour.active,
        priority: tour.priority,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('tours')
        .insert(tourData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToTour(data);
    } catch (error: any) {
      console.error('Failed to create tour:', error);
      throw error;
    }
  }

  // Get tours for user
  async getToursForUser(userId: string, url?: string): Promise<Tour[]> {
    try {
      const { data: tours } = await supabase
        .from('tours')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: false });

      if (!tours) return [];

      // Get user's tour views
      const { data: views } = await supabase
        .from('tour_views')
        .select('*')
        .eq('user_id', userId);

      const viewedTourIds = new Set(views?.map((v: any) => v.tour_id) || []);

      // Get user profile for targeting
      const { data: profile } = await supabase
        .from('users')
        .select('role, created_at')
        .eq('id', userId)
        .single();

      const eligibleTours = tours.filter((tour: any) => {
        const t = this.mapToTour(tour);

        // Check if already viewed (and should only show once)
        if (t.targeting.showOnce && viewedTourIds.has(t.id)) {
          return false;
        }

        // Check URL matching
        if (t.targeting.url && url && !url.includes(t.targeting.url)) {
          return false;
        }

        // Check role
        if (t.targeting.roles && profile && !t.targeting.roles.includes(profile.role)) {
          return false;
        }

        // Check days since signup
        if (profile?.created_at) {
          const daysSinceSignup = Math.floor(
            (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          if (t.targeting.minDaysSinceSignup && daysSinceSignup < t.targeting.minDaysSinceSignup) {
            return false;
          }

          if (t.targeting.maxDaysSinceSignup && daysSinceSignup > t.targeting.maxDaysSinceSignup) {
            return false;
          }
        }

        return true;
      });

      return eligibleTours.map(this.mapToTour);
    } catch (error) {
      console.error('Failed to get tours for user:', error);
      return [];
    }
  }

  // Mark tour as viewed
  async markTourViewed(userId: string, tourId: string, completed: boolean = false): Promise<boolean> {
    try {
      await supabase.from('tour_views').upsert({
        user_id: userId,
        tour_id: tourId,
        viewed_at: new Date().toISOString(),
        completed,
      });

      return true;
    } catch (error) {
      console.error('Failed to mark tour as viewed:', error);
      return false;
    }
  }

  // Get analytics
  async getAnalytics(flowId: string): Promise<OnboardingAnalytics> {
    try {
      const { data: onboardings } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('flow_id', flowId);

      const flow = await this.getFlow(flowId);

      if (!onboardings || !flow) {
        return {
          totalUsers: 0,
          completed: 0,
          inProgress: 0,
          completionRate: 0,
          averageTimeToComplete: 0,
          dropoffByStep: {},
          popularSkips: [],
        };
      }

      const completed = onboardings.filter(o => o.status === OnboardingStatus.COMPLETED).length;
      const inProgress = onboardings.filter(o => o.status === OnboardingStatus.IN_PROGRESS).length;

      const completionTimes = onboardings
        .filter(o => o.completed_at && o.started_at)
        .map(o => new Date(o.completed_at).getTime() - new Date(o.started_at).getTime());

      const averageTime = completionTimes.length > 0
        ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
        : 0;

      // Calculate dropoff by step
      const dropoffByStep: Record<string, number> = {};
      flow.steps.forEach((step) => {
        const startedStep = onboardings.filter(o => 
          o.completed_steps.includes(step.id) || o.current_step === step.id
        ).length;
        const completedStep = onboardings.filter(o => 
          o.completed_steps.includes(step.id)
        ).length;

        if (startedStep > 0) {
          dropoffByStep[step.id] = ((startedStep - completedStep) / startedStep) * 100;
        }
      });

      // Popular skips
      const skipCounts: Record<string, number> = {};
      onboardings.forEach((o) => {
        o.skipped_steps?.forEach((stepId: string) => {
          skipCounts[stepId] = (skipCounts[stepId] || 0) + 1;
        });
      });

      const popularSkips = Object.entries(skipCounts)
        .map(([stepId, count]) => ({ stepId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalUsers: onboardings.length,
        completed,
        inProgress,
        completionRate: onboardings.length > 0 ? (completed / onboardings.length) * 100 : 0,
        averageTimeToComplete: averageTime,
        dropoffByStep,
        popularSkips,
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalUsers: 0,
        completed: 0,
        inProgress: 0,
        completionRate: 0,
        averageTimeToComplete: 0,
        dropoffByStep: {},
        popularSkips: [],
      };
    }
  }

  // Track event
  private async trackEvent(
    userId: string,
    flowId: string,
    stepId: string,
    eventType: string
  ): Promise<void> {
    try {
      await supabase.from('onboarding_events').insert({
        user_id: userId,
        flow_id: flowId,
        step_id: stepId,
        event_type: eventType,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Helper methods
  private mapToFlow(data: any): OnboardingFlow {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      steps: data.steps,
      optional: data.optional,
      order: data.order,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToUserOnboarding(data: any): UserOnboarding {
    return {
      id: data.id,
      userId: data.user_id,
      flowId: data.flow_id,
      status: data.status,
      currentStep: data.current_step,
      completedSteps: data.completed_steps || [],
      skippedSteps: data.skipped_steps || [],
      startedAt: data.started_at,
      completedAt: data.completed_at,
      metadata: data.metadata,
    };
  }

  private mapToTour(data: any): Tour {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      description: data.description,
      steps: data.steps,
      targeting: data.targeting,
      active: data.active,
      priority: data.priority,
      createdAt: data.created_at,
    };
  }
}

// Export singleton instance
export const onboarding = OnboardingSystem.getInstance();

// Convenience functions
export const createOnboardingFlow = (flow: any) => onboarding.createFlow(flow);
export const startUserOnboarding = (userId: string, flowId: string) => 
  onboarding.startOnboarding(userId, flowId);
export const completeOnboardingStep = (userId: string, flowId: string, stepId: string) =>
  onboarding.completeStep(userId, flowId, stepId);
export const getUserOnboardingProgress = (userId: string) => onboarding.getUserProgress(userId);
export const createProductTour = (tour: any) => onboarding.createTour(tour);
export const getUserTours = (userId: string, url?: string) => onboarding.getToursForUser(userId, url);

