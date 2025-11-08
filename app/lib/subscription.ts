import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  PAUSED = 'paused',
  EXPIRED = 'expired',
}

export enum BillingInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export enum PricingModel {
  FLAT_RATE = 'flat_rate',
  PER_UNIT = 'per_unit',
  TIERED = 'tiered',
  VOLUME = 'volume',
  GRADUATED = 'graduated',
}

export enum SubscriptionType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  type: SubscriptionType;
  pricingModel: PricingModel;
  basePrice: number;
  currency: string;
  billingInterval: BillingInterval;
  intervalCount: number;
  trialDays?: number;
  features: PlanFeature[];
  limits: PlanLimits;
  metadata?: Record<string, any>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFeature {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  limit?: number;
}

export interface PlanLimits {
  users?: number;
  storage?: number;
  transactions?: number;
  apiCalls?: number;
  customFields?: Record<string, number>;
}

export interface PricingTier {
  upTo: number;
  price: number;
  flatFee?: number;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string;
  trialEnd?: string;
  canceledAt?: string;
  cancelAtPeriodEnd: boolean;
  quantity: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Usage {
  id: string;
  subscriptionId: string;
  metricId: string;
  quantity: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UsageMetric {
  id: string;
  name: string;
  description?: string;
  unit: string;
  aggregation: 'sum' | 'max' | 'latest';
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: string;
  paidAt?: string;
  attemptCount: number;
  periodStart: string;
  periodEnd: string;
  lineItems: InvoiceLineItem[];
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  metadata?: Record<string, any>;
}

export interface MembershipTier {
  id: string;
  name: string;
  level: number;
  benefits: string[];
  requirements: {
    minSpend?: number;
    minTransactions?: number;
    minDays?: number;
  };
  color: string;
  icon?: string;
}

export interface UserMembership {
  userId: string;
  tierId: string;
  level: number;
  joinedAt: string;
  expiresAt?: string;
  points: number;
  lifetime: {
    spend: number;
    transactions: number;
    days: number;
  };
}

export interface Addon {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingInterval?: BillingInterval;
  features: string[];
  active: boolean;
}

export interface SubscriptionAddon {
  id: string;
  subscriptionId: string;
  addonId: string;
  quantity: number;
  addedAt: string;
}

export interface SubscriptionChange {
  id: string;
  subscriptionId: string;
  fromPlanId?: string;
  toPlanId?: string;
  changeType: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate' | 'pause' | 'resume';
  effectiveDate: string;
  proration?: {
    credited: number;
    charged: number;
  };
  createdBy: string;
  createdAt: string;
}

export interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  mrr: number;
  arr: number;
  churnRate: number;
  ltv: number;
  averageSubscriptionValue: number;
  byPlan: Record<string, {
    count: number;
    revenue: number;
  }>;
  byStatus: Record<SubscriptionStatus, number>;
  trends: Array<{
    date: string;
    newSubscriptions: number;
    canceledSubscriptions: number;
    mrr: number;
  }>;
}

class SubscriptionSystem {
  private static instance: SubscriptionSystem;

  private constructor() {}

  static getInstance(): SubscriptionSystem {
    if (!SubscriptionSystem.instance) {
      SubscriptionSystem.instance = new SubscriptionSystem();
    }
    return SubscriptionSystem.instance;
  }

  // Create plan
  async createPlan(plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlan> {
    try {
      const planData = {
        name: plan.name,
        description: plan.description,
        type: plan.type,
        pricing_model: plan.pricingModel,
        base_price: plan.basePrice,
        currency: plan.currency,
        billing_interval: plan.billingInterval,
        interval_count: plan.intervalCount,
        trial_days: plan.trialDays,
        features: plan.features,
        limits: plan.limits,
        metadata: plan.metadata,
        active: plan.active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('subscription_plans')
        .insert(planData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToPlan(data);
    } catch (error: any) {
      console.error('Failed to create plan:', error);
      throw error;
    }
  }

  // Get plan
  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
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

  // List plans
  async listPlans(activeOnly: boolean = true): Promise<SubscriptionPlan[]> {
    try {
      let query = supabase.from('subscription_plans').select('*');

      if (activeOnly) {
        query = query.eq('active', true);
      }

      query = query.order('base_price', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToPlan);
    } catch (error) {
      console.error('Failed to list plans:', error);
      return [];
    }
  }

  // Subscribe
  async subscribe(
    userId: string,
    planId: string,
    options?: {
      trialDays?: number;
      quantity?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<Subscription> {
    try {
      const plan = await this.getPlan(planId);

      if (!plan) {
        throw new Error('Plan not found');
      }

      const now = new Date();
      const trialDays = options?.trialDays ?? plan.trialDays ?? 0;
      
      let periodStart = new Date(now);
      let periodEnd = new Date(now);
      let trialStart: Date | undefined;
      let trialEnd: Date | undefined;

      if (trialDays > 0) {
        trialStart = new Date(now);
        trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        periodStart = new Date(trialEnd);
      }

      // Calculate period end based on billing interval
      periodEnd = this.calculatePeriodEnd(periodStart, plan.billingInterval, plan.intervalCount);

      const subscriptionData = {
        user_id: userId,
        plan_id: planId,
        status: trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_start: trialStart?.toISOString(),
        trial_end: trialEnd?.toISOString(),
        cancel_at_period_end: false,
        quantity: options?.quantity || 1,
        metadata: options?.metadata,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;

      // Create first invoice
      await this.createInvoice(data.id);

      return this.mapToSubscription(data);
    } catch (error: any) {
      console.error('Failed to subscribe:', error);
      throw error;
    }
  }

  // Get subscription
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (error || !data) return null;

      return this.mapToSubscription(data);
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  // Get user subscriptions
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToSubscription);
    } catch (error) {
      console.error('Failed to get user subscriptions:', error);
      return [];
    }
  }

  // Update subscription
  async updateSubscription(
    subscriptionId: string,
    updates: {
      planId?: string;
      quantity?: number;
      cancelAtPeriodEnd?: boolean;
    }
  ): Promise<Subscription | null> {
    try {
      const subscription = await this.getSubscription(subscriptionId);

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.planId && updates.planId !== subscription.planId) {
        // Plan change
        updateData.plan_id = updates.planId;

        // Record the change
        await this.recordSubscriptionChange({
          subscriptionId,
          fromPlanId: subscription.planId,
          toPlanId: updates.planId,
          changeType: 'upgrade', // Simplified
          effectiveDate: new Date().toISOString(),
          createdBy: subscription.userId,
        });

        // Handle proration
        await this.handleProration(subscriptionId, subscription.planId, updates.planId);
      }

      if (updates.quantity !== undefined) {
        updateData.quantity = updates.quantity;
      }

      if (updates.cancelAtPeriodEnd !== undefined) {
        updateData.cancel_at_period_end = updates.cancelAtPeriodEnd;
        if (updates.cancelAtPeriodEnd) {
          updateData.canceled_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;

      return this.mapToSubscription(data);
    } catch (error) {
      console.error('Failed to update subscription:', error);
      return null;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, immediate: boolean = false): Promise<boolean> {
    try {
      const updates: any = {
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (immediate) {
        updates.status = SubscriptionStatus.CANCELED;
        updates.current_period_end = new Date().toISOString();
      } else {
        updates.cancel_at_period_end = true;
      }

      const { error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscriptionId);

      if (error) throw error;

      // Record the change
      await this.recordSubscriptionChange({
        subscriptionId,
        changeType: 'cancel',
        effectiveDate: immediate ? new Date().toISOString() : updates.current_period_end,
        createdBy: 'system',
      });

      return true;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  // Track usage
  async trackUsage(
    subscriptionId: string,
    metricId: string,
    quantity: number,
    metadata?: Record<string, any>
  ): Promise<Usage> {
    try {
      const usageData = {
        subscription_id: subscriptionId,
        metric_id: metricId,
        quantity,
        timestamp: new Date().toISOString(),
        metadata,
      };

      const { data, error } = await supabase
        .from('usage')
        .insert(usageData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToUsage(data);
    } catch (error: any) {
      console.error('Failed to track usage:', error);
      throw error;
    }
  }

  // Get usage
  async getUsage(
    subscriptionId: string,
    metricId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('usage')
        .select('quantity')
        .eq('subscription_id', subscriptionId)
        .eq('metric_id', metricId)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      if (error) throw error;

      return (data || []).reduce((sum, u) => sum + u.quantity, 0);
    } catch (error) {
      console.error('Failed to get usage:', error);
      return 0;
    }
  }

  // Create invoice
  async createInvoice(subscriptionId: string): Promise<Invoice> {
    try {
      const subscription = await this.getSubscription(subscriptionId);

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const plan = await this.getPlan(subscription.planId);

      if (!plan) {
        throw new Error('Plan not found');
      }

      const lineItems: InvoiceLineItem[] = [
        {
          id: crypto.randomUUID(),
          description: `${plan.name} subscription`,
          quantity: subscription.quantity,
          unitPrice: plan.basePrice,
          amount: plan.basePrice * subscription.quantity,
        },
      ];

      // Add addon charges
      const addons = await this.getSubscriptionAddons(subscriptionId);
      for (const addon of addons) {
        const addonDetails = await this.getAddon(addon.addonId);
        if (addonDetails) {
          lineItems.push({
            id: crypto.randomUUID(),
            description: addonDetails.name,
            quantity: addon.quantity,
            unitPrice: addonDetails.price,
            amount: addonDetails.price * addon.quantity,
          });
        }
      }

      const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

      const invoiceData = {
        subscription_id: subscriptionId,
        user_id: subscription.userId,
        amount: totalAmount,
        currency: plan.currency,
        status: 'open',
        due_date: subscription.currentPeriodEnd,
        attempt_count: 0,
        period_start: subscription.currentPeriodStart,
        period_end: subscription.currentPeriodEnd,
        line_items: lineItems,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToInvoice(data);
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  }

  // Get invoices
  async getInvoices(userId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToInvoice);
    } catch (error) {
      console.error('Failed to get invoices:', error);
      return [];
    }
  }

  // Add addon
  async addAddon(subscriptionId: string, addonId: string, quantity: number = 1): Promise<SubscriptionAddon> {
    try {
      const addonData = {
        subscription_id: subscriptionId,
        addon_id: addonId,
        quantity,
        added_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('subscription_addons')
        .insert(addonData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToSubscriptionAddon(data);
    } catch (error: any) {
      console.error('Failed to add addon:', error);
      throw error;
    }
  }

  // Get subscription addons
  async getSubscriptionAddons(subscriptionId: string): Promise<SubscriptionAddon[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_addons')
        .select('*')
        .eq('subscription_id', subscriptionId);

      if (error) throw error;

      return (data || []).map(this.mapToSubscriptionAddon);
    } catch (error) {
      console.error('Failed to get subscription addons:', error);
      return [];
    }
  }

  // Get addon
  async getAddon(addonId: string): Promise<Addon | null> {
    try {
      const { data, error } = await supabase
        .from('addons')
        .select('*')
        .eq('id', addonId)
        .single();

      if (error || !data) return null;

      return this.mapToAddon(data);
    } catch (error) {
      return null;
    }
  }

  // Get analytics
  async getAnalytics(days: number = 30): Promise<SubscriptionAnalytics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const { data: allSubscriptions } = await supabase
        .from('subscriptions')
        .select('*');

      const activeSubscriptions = allSubscriptions?.filter(
        s => s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.TRIALING
      ) || [];

      // Calculate MRR
      let mrr = 0;
      for (const sub of activeSubscriptions) {
        const plan = await this.getPlan(sub.plan_id);
        if (plan) {
          const monthlyValue = this.normalizeToMonthly(
            plan.basePrice * sub.quantity,
            plan.billingInterval,
            plan.intervalCount
          );
          mrr += monthlyValue;
        }
      }

      const arr = mrr * 12;

      // Calculate churn
      const canceledCount = subscriptions?.filter(
        s => s.status === SubscriptionStatus.CANCELED
      ).length || 0;
      const churnRate = subscriptions?.length ? (canceledCount / subscriptions.length) * 100 : 0;

      const byStatus: Record<SubscriptionStatus, number> = {
        [SubscriptionStatus.ACTIVE]: 0,
        [SubscriptionStatus.TRIALING]: 0,
        [SubscriptionStatus.PAST_DUE]: 0,
        [SubscriptionStatus.CANCELED]: 0,
        [SubscriptionStatus.UNPAID]: 0,
        [SubscriptionStatus.PAUSED]: 0,
        [SubscriptionStatus.EXPIRED]: 0,
      };

      allSubscriptions?.forEach(s => {
        byStatus[s.status as SubscriptionStatus]++;
      });

      return {
        totalSubscriptions: allSubscriptions?.length || 0,
        activeSubscriptions: activeSubscriptions.length,
        mrr,
        arr,
        churnRate,
        ltv: mrr > 0 ? mrr / (churnRate / 100 || 1) : 0,
        averageSubscriptionValue: activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0,
        byPlan: {},
        byStatus,
        trends: [],
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        mrr: 0,
        arr: 0,
        churnRate: 0,
        ltv: 0,
        averageSubscriptionValue: 0,
        byPlan: {},
        byStatus: {} as any,
        trends: [],
      };
    }
  }

  // Helper methods
  private calculatePeriodEnd(start: Date, interval: BillingInterval, count: number): Date {
    const end = new Date(start);

    switch (interval) {
      case BillingInterval.DAY:
        end.setDate(end.getDate() + count);
        break;
      case BillingInterval.WEEK:
        end.setDate(end.getDate() + (7 * count));
        break;
      case BillingInterval.MONTH:
        end.setMonth(end.getMonth() + count);
        break;
      case BillingInterval.QUARTER:
        end.setMonth(end.getMonth() + (3 * count));
        break;
      case BillingInterval.YEAR:
        end.setFullYear(end.getFullYear() + count);
        break;
    }

    return end;
  }

  private normalizeToMonthly(amount: number, interval: BillingInterval, count: number): number {
    switch (interval) {
      case BillingInterval.DAY:
        return amount * (30 / count);
      case BillingInterval.WEEK:
        return amount * (4.33 / count);
      case BillingInterval.MONTH:
        return amount / count;
      case BillingInterval.QUARTER:
        return amount / (3 * count);
      case BillingInterval.YEAR:
        return amount / (12 * count);
      default:
        return amount;
    }
  }

  private async handleProration(subscriptionId: string, fromPlanId: string, toPlanId: string): Promise<void> {
    try {
      const fromPlan = await this.getPlan(fromPlanId);
      const toPlan = await this.getPlan(toPlanId);

      if (!fromPlan || !toPlan) return;

      // Simplified proration logic
      const credited = fromPlan.basePrice * 0.5; // Simplified
      const charged = toPlan.basePrice;

      // Store proration details
      await supabase.from('prorations').insert({
        subscription_id: subscriptionId,
        credited,
        charged,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to handle proration:', error);
    }
  }

  private async recordSubscriptionChange(change: Omit<SubscriptionChange, 'id' | 'createdAt'>): Promise<void> {
    try {
      await supabase.from('subscription_changes').insert({
        subscription_id: change.subscriptionId,
        from_plan_id: change.fromPlanId,
        to_plan_id: change.toPlanId,
        change_type: change.changeType,
        effective_date: change.effectiveDate,
        proration: change.proration,
        created_by: change.createdBy,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to record subscription change:', error);
    }
  }

  private mapToPlan(data: any): SubscriptionPlan {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      pricingModel: data.pricing_model,
      basePrice: data.base_price,
      currency: data.currency,
      billingInterval: data.billing_interval,
      intervalCount: data.interval_count,
      trialDays: data.trial_days,
      features: data.features,
      limits: data.limits,
      metadata: data.metadata,
      active: data.active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToSubscription(data: any): Subscription {
    return {
      id: data.id,
      userId: data.user_id,
      planId: data.plan_id,
      status: data.status,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      trialStart: data.trial_start,
      trialEnd: data.trial_end,
      canceledAt: data.canceled_at,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      quantity: data.quantity,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToUsage(data: any): Usage {
    return {
      id: data.id,
      subscriptionId: data.subscription_id,
      metricId: data.metric_id,
      quantity: data.quantity,
      timestamp: data.timestamp,
      metadata: data.metadata,
    };
  }

  private mapToInvoice(data: any): Invoice {
    return {
      id: data.id,
      subscriptionId: data.subscription_id,
      userId: data.user_id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      dueDate: data.due_date,
      paidAt: data.paid_at,
      attemptCount: data.attempt_count,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      lineItems: data.line_items,
      metadata: data.metadata,
      createdAt: data.created_at,
    };
  }

  private mapToSubscriptionAddon(data: any): SubscriptionAddon {
    return {
      id: data.id,
      subscriptionId: data.subscription_id,
      addonId: data.addon_id,
      quantity: data.quantity,
      addedAt: data.added_at,
    };
  }

  private mapToAddon(data: any): Addon {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency,
      billingInterval: data.billing_interval,
      features: data.features,
      active: data.active,
    };
  }
}

// Export singleton instance
export const subscriptionSystem = SubscriptionSystem.getInstance();

// Convenience functions
export const createPlan = (plan: any) => subscriptionSystem.createPlan(plan);
export const getPlan = (planId: string) => subscriptionSystem.getPlan(planId);
export const listPlans = (activeOnly?: boolean) => subscriptionSystem.listPlans(activeOnly);
export const subscribe = (userId: string, planId: string, options?: any) =>
  subscriptionSystem.subscribe(userId, planId, options);
export const getSubscription = (subscriptionId: string) => subscriptionSystem.getSubscription(subscriptionId);
export const cancelSubscription = (subscriptionId: string, immediate?: boolean) =>
  subscriptionSystem.cancelSubscription(subscriptionId, immediate);
export const trackUsage = (subscriptionId: string, metricId: string, quantity: number, metadata?: any) =>
  subscriptionSystem.trackUsage(subscriptionId, metricId, quantity, metadata);
export const getSubscriptionAnalytics = (days?: number) => subscriptionSystem.getAnalytics(days);

