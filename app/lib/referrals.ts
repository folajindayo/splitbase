import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum ReferralStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CONVERTED = 'converted',
  REWARDED = 'rewarded',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum RewardType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  CREDIT = 'credit',
  PLAN_UPGRADE = 'plan_upgrade',
  CUSTOM = 'custom',
}

export enum CommissionTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export interface ReferralProgram {
  id: string;
  name: string;
  description?: string;
  code: string;
  active: boolean;
  rewards: {
    referrer: Reward;
    referee: Reward;
  };
  rules: {
    minimumPurchase?: number;
    expiryDays?: number;
    maxRedemptions?: number;
    requiresVerification?: boolean;
    allowedCountries?: string[];
    excludedPlans?: string[];
  };
  tiers?: CommissionTierConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  type: RewardType;
  value: number;
  currency?: string;
  description?: string;
  conditions?: string[];
}

export interface CommissionTierConfig {
  tier: CommissionTier;
  minReferrals: number;
  commissionRate: number;
  bonusRewards?: Reward[];
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId?: string;
  programId: string;
  code: string;
  status: ReferralStatus;
  metadata?: {
    source?: string;
    campaign?: string;
    medium?: string;
  };
  clickCount: number;
  conversionValue?: number;
  reward?: {
    amount: number;
    currency: string;
    paidAt?: string;
  };
  createdAt: string;
  convertedAt?: string;
  expiresAt?: string;
}

export interface Affiliate {
  id: string;
  userId: string;
  name: string;
  email: string;
  code: string;
  tier: CommissionTier;
  active: boolean;
  stats: {
    totalReferrals: number;
    conversions: number;
    totalEarned: number;
    pendingEarnings: number;
    conversionRate: number;
  };
  paymentInfo?: {
    method: string;
    details: Record<string, any>;
  };
  joinedAt: string;
  lastActivityAt?: string;
}

export interface ReferralClick {
  id: string;
  referralCode: string;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  country?: string;
  device?: string;
  timestamp: string;
}

export interface Commission {
  id: string;
  affiliateId: string;
  referralId: string;
  amount: number;
  currency: string;
  tier: CommissionTier;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paidAt?: string;
  createdAt: string;
}

export interface ReferralStatistics {
  totalReferrals: number;
  activeReferrals: number;
  conversions: number;
  conversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  topReferrers: Array<{
    userId: string;
    name: string;
    referrals: number;
    conversions: number;
    earnings: number;
  }>;
  byProgram: Record<string, {
    referrals: number;
    conversions: number;
  }>;
  timeline: Array<{
    date: string;
    referrals: number;
    conversions: number;
    revenue: number;
  }>;
}

class ReferralSystem {
  private static instance: ReferralSystem;
  private readonly DEFAULT_EXPIRY_DAYS = 30;
  private readonly CODE_LENGTH = 8;

  private constructor() {}

  static getInstance(): ReferralSystem {
    if (!ReferralSystem.instance) {
      ReferralSystem.instance = new ReferralSystem();
    }
    return ReferralSystem.instance;
  }

  // Create referral program
  async createProgram(program: Omit<ReferralProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReferralProgram> {
    try {
      const programData = {
        name: program.name,
        description: program.description,
        code: program.code,
        active: program.active,
        rewards: program.rewards,
        rules: program.rules,
        tiers: program.tiers,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('referral_programs')
        .insert(programData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToReferralProgram(data);
    } catch (error: any) {
      console.error('Failed to create referral program:', error);
      throw error;
    }
  }

  // Generate referral code
  async generateReferralCode(userId: string, programId?: string): Promise<Referral> {
    try {
      const code = await this.createUniqueCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.DEFAULT_EXPIRY_DAYS);

      const referralData = {
        referrer_id: userId,
        program_id: programId || 'default',
        code,
        status: ReferralStatus.ACTIVE,
        click_count: 0,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      };

      const { data, error } = await supabase
        .from('referrals')
        .insert(referralData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToReferral(data);
    } catch (error: any) {
      console.error('Failed to generate referral code:', error);
      throw error;
    }
  }

  // Track click
  async trackClick(code: string, metadata?: {
    ipAddress?: string;
    userAgent?: string;
    referer?: string;
    country?: string;
    device?: string;
  }): Promise<boolean> {
    try {
      // Record click
      await supabase.from('referral_clicks').insert({
        referral_code: code,
        ip_address: metadata?.ipAddress,
        user_agent: metadata?.userAgent,
        referer: metadata?.referer,
        country: metadata?.country,
        device: metadata?.device,
        timestamp: new Date().toISOString(),
      });

      // Increment click count
      await supabase.rpc('increment_referral_clicks', { p_code: code });

      return true;
    } catch (error) {
      console.error('Failed to track click:', error);
      return false;
    }
  }

  // Convert referral
  async convertReferral(code: string, refereeId: string, conversionValue?: number): Promise<boolean> {
    try {
      const { data: referral, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('code', code)
        .eq('status', ReferralStatus.ACTIVE)
        .single();

      if (error || !referral) {
        return false;
      }

      // Check expiry
      if (referral.expires_at && new Date(referral.expires_at) < new Date()) {
        await this.updateStatus(code, ReferralStatus.EXPIRED);
        return false;
      }

      // Update referral
      await supabase
        .from('referrals')
        .update({
          referee_id: refereeId,
          status: ReferralStatus.CONVERTED,
          converted_at: new Date().toISOString(),
          conversion_value: conversionValue,
        })
        .eq('code', code);

      // Create commission
      await this.createCommission(referral.id, referral.referrer_id, conversionValue);

      // Award rewards
      await this.awardRewards(referral.program_id, referral.referrer_id, refereeId);

      return true;
    } catch (error) {
      console.error('Failed to convert referral:', error);
      return false;
    }
  }

  // Get referral by code
  async getByCode(code: string): Promise<Referral | null> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !data) return null;

      return this.mapToReferral(data);
    } catch (error) {
      console.error('Failed to get referral:', error);
      return null;
    }
  }

  // Get user referrals
  async getUserReferrals(userId: string, status?: ReferralStatus): Promise<Referral[]> {
    try {
      let query = supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToReferral);
    } catch (error) {
      console.error('Failed to get user referrals:', error);
      return [];
    }
  }

  // Create/Update affiliate
  async createAffiliate(data: {
    userId: string;
    name: string;
    email: string;
    paymentInfo?: Affiliate['paymentInfo'];
  }): Promise<Affiliate> {
    try {
      const code = await this.createUniqueCode();

      const affiliateData = {
        user_id: data.userId,
        name: data.name,
        email: data.email,
        code,
        tier: CommissionTier.BRONZE,
        active: true,
        stats: {
          totalReferrals: 0,
          conversions: 0,
          totalEarned: 0,
          pendingEarnings: 0,
          conversionRate: 0,
        },
        payment_info: data.paymentInfo,
        joined_at: new Date().toISOString(),
      };

      const { data: affiliate, error } = await supabase
        .from('affiliates')
        .insert(affiliateData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToAffiliate(affiliate);
    } catch (error: any) {
      console.error('Failed to create affiliate:', error);
      throw error;
    }
  }

  // Get affiliate
  async getAffiliate(userId: string): Promise<Affiliate | null> {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return this.mapToAffiliate(data);
    } catch (error) {
      console.error('Failed to get affiliate:', error);
      return null;
    }
  }

  // Update affiliate tier
  async updateAffiliateTier(userId: string, tier: CommissionTier): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ tier })
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Failed to update tier:', error);
      return false;
    }
  }

  // Create commission
  private async createCommission(
    referralId: string,
    affiliateUserId: string,
    value?: number
  ): Promise<void> {
    try {
      const affiliate = await this.getAffiliate(affiliateUserId);

      if (!affiliate) return;

      // Calculate commission based on tier
      const rate = this.getCommissionRate(affiliate.tier);
      const amount = (value || 0) * rate;

      await supabase.from('commissions').insert({
        affiliate_id: affiliate.id,
        referral_id: referralId,
        amount,
        currency: 'USD',
        tier: affiliate.tier,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      // Update affiliate stats
      await this.updateAffiliateStats(affiliate.id);
    } catch (error) {
      console.error('Failed to create commission:', error);
    }
  }

  // Award rewards
  private async awardRewards(
    programId: string,
    referrerId: string,
    refereeId: string
  ): Promise<void> {
    try {
      const { data: program } = await supabase
        .from('referral_programs')
        .select('*')
        .eq('id', programId)
        .single();

      if (!program) return;

      // Award referrer reward
      if (program.rewards?.referrer) {
        await this.processReward(referrerId, program.rewards.referrer);
      }

      // Award referee reward
      if (program.rewards?.referee) {
        await this.processReward(refereeId, program.rewards.referee);
      }
    } catch (error) {
      console.error('Failed to award rewards:', error);
    }
  }

  // Process reward
  private async processReward(userId: string, reward: Reward): Promise<void> {
    try {
      switch (reward.type) {
        case RewardType.CREDIT:
          // Add credit to user wallet
          console.log(`Awarding ${reward.value} credit to user ${userId}`);
          break;

        case RewardType.FIXED_AMOUNT:
          // Process payment
          console.log(`Awarding ${reward.value} ${reward.currency} to user ${userId}`);
          break;

        case RewardType.PLAN_UPGRADE:
          // Upgrade user plan
          console.log(`Upgrading plan for user ${userId}`);
          break;

        default:
          console.log(`Processing custom reward for user ${userId}`);
      }
    } catch (error) {
      console.error('Failed to process reward:', error);
    }
  }

  // Get statistics
  async getStatistics(options: {
    userId?: string;
    programId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ReferralStatistics> {
    try {
      let query = supabase.from('referrals').select('*');

      if (options.userId) {
        query = query.eq('referrer_id', options.userId);
      }

      if (options.programId) {
        query = query.eq('program_id', options.programId);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }

      const { data: referrals, error } = await query;

      if (error) throw error;

      const stats: ReferralStatistics = {
        totalReferrals: referrals?.length || 0,
        activeReferrals: referrals?.filter(r => r.status === ReferralStatus.ACTIVE).length || 0,
        conversions: referrals?.filter(r => r.status === ReferralStatus.CONVERTED).length || 0,
        conversionRate: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topReferrers: [],
        byProgram: {},
        timeline: [],
      };

      if (stats.totalReferrals > 0) {
        stats.conversionRate = (stats.conversions / stats.totalReferrals) * 100;
      }

      const totalValue = referrals?.reduce((sum, r) => sum + (r.conversion_value || 0), 0) || 0;
      stats.totalRevenue = totalValue;
      stats.averageOrderValue = stats.conversions > 0 ? totalValue / stats.conversions : 0;

      return stats;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        conversions: 0,
        conversionRate: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        topReferrers: [],
        byProgram: {},
        timeline: [],
      };
    }
  }

  // Helper methods
  private async createUniqueCode(): Promise<string> {
    let code: string;
    let exists = true;

    while (exists) {
      code = this.generateCode();
      const { data } = await supabase
        .from('referrals')
        .select('code')
        .eq('code', code)
        .single();

      exists = !!data;
    }

    return code!;
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < this.CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return code;
  }

  private getCommissionRate(tier: CommissionTier): number {
    const rates = {
      [CommissionTier.BRONZE]: 0.05,
      [CommissionTier.SILVER]: 0.10,
      [CommissionTier.GOLD]: 0.15,
      [CommissionTier.PLATINUM]: 0.20,
    };

    return rates[tier];
  }

  private async updateStatus(code: string, status: ReferralStatus): Promise<void> {
    await supabase
      .from('referrals')
      .update({ status })
      .eq('code', code);
  }

  private async updateAffiliateStats(affiliateId: string): Promise<void> {
    // Recalculate stats
    const { data: commissions } = await supabase
      .from('commissions')
      .select('*')
      .eq('affiliate_id', affiliateId);

    const stats = {
      totalReferrals: commissions?.length || 0,
      conversions: commissions?.filter(c => c.status !== 'cancelled').length || 0,
      totalEarned: commissions?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0) || 0,
      pendingEarnings: commissions?.filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.amount, 0) || 0,
      conversionRate: 0,
    };

    if (stats.totalReferrals > 0) {
      stats.conversionRate = (stats.conversions / stats.totalReferrals) * 100;
    }

    await supabase
      .from('affiliates')
      .update({
        stats,
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', affiliateId);
  }

  // Map database records
  private mapToReferralProgram(data: any): ReferralProgram {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      code: data.code,
      active: data.active,
      rewards: data.rewards,
      rules: data.rules,
      tiers: data.tiers,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToReferral(data: any): Referral {
    return {
      id: data.id,
      referrerId: data.referrer_id,
      refereeId: data.referee_id,
      programId: data.program_id,
      code: data.code,
      status: data.status,
      metadata: data.metadata,
      clickCount: data.click_count,
      conversionValue: data.conversion_value,
      reward: data.reward,
      createdAt: data.created_at,
      convertedAt: data.converted_at,
      expiresAt: data.expires_at,
    };
  }

  private mapToAffiliate(data: any): Affiliate {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      code: data.code,
      tier: data.tier,
      active: data.active,
      stats: data.stats,
      paymentInfo: data.payment_info,
      joinedAt: data.joined_at,
      lastActivityAt: data.last_activity_at,
    };
  }
}

// Export singleton instance
export const referrals = ReferralSystem.getInstance();

// Convenience functions
export const generateReferralCode = (userId: string, programId?: string) =>
  referrals.generateReferralCode(userId, programId);

export const trackReferralClick = (code: string, metadata?: any) =>
  referrals.trackClick(code, metadata);

export const convertReferral = (code: string, refereeId: string, value?: number) =>
  referrals.convertReferral(code, refereeId, value);

export const getReferralByCode = (code: string) => referrals.getByCode(code);

export const getUserReferrals = (userId: string, status?: ReferralStatus) =>
  referrals.getUserReferrals(userId, status);

export const createAffiliate = (data: any) => referrals.createAffiliate(data);

export const getReferralStats = (options?: any) => referrals.getStatistics(options);


