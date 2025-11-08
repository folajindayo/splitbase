import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum EscrowStatus {
  DRAFT = 'draft',
  PENDING_FUNDING = 'pending_funding',
  FUNDED = 'funded',
  IN_PROGRESS = 'in_progress',
  PENDING_RELEASE = 'pending_release',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum EscrowType {
  STANDARD = 'standard',
  MILESTONE = 'milestone',
  RECURRING = 'recurring',
  CONDITIONAL = 'conditional',
}

export enum ParticipantRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  AGENT = 'agent',
  ARBITER = 'arbiter',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface EscrowParticipant {
  userId: string;
  role: ParticipantRole;
  email: string;
  name: string;
  permissions?: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  status: MilestoneStatus;
  dueDate?: string;
  completedAt?: string;
  approvedBy?: string[];
  rejectedBy?: string[];
  notes?: string;
}

export interface EscrowCondition {
  id: string;
  type: string;
  description: string;
  required: boolean;
  met: boolean;
  metAt?: string;
  verifiedBy?: string;
}

export interface EscrowConfig {
  type: EscrowType;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  buyer: EscrowParticipant;
  seller: EscrowParticipant;
  agent?: EscrowParticipant;
  arbiter?: EscrowParticipant;
  milestones?: Omit<Milestone, 'id' | 'status' | 'completedAt' | 'approvedBy' | 'rejectedBy'>[];
  conditions?: Omit<EscrowCondition, 'id' | 'met' | 'metAt' | 'verifiedBy'>[];
  settings?: {
    autoRelease?: boolean;
    releaseDelay?: number; // hours
    requiresBuyerApproval?: boolean;
    requiresSellerConfirmation?: boolean;
    disputePeriod?: number; // days
    expiryDate?: string;
  };
  metadata?: Record<string, any>;
}

export interface Escrow {
  id: string;
  type: EscrowType;
  status: EscrowStatus;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  participants: EscrowParticipant[];
  milestones: Milestone[];
  conditions: EscrowCondition[];
  settings: {
    autoRelease: boolean;
    releaseDelay: number;
    requiresBuyerApproval: boolean;
    requiresSellerConfirmation: boolean;
    disputePeriod: number;
    expiryDate?: string;
  };
  transactions: EscrowTransaction[];
  timeline: EscrowEvent[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  fundedAt?: string;
  completedAt?: string;
}

export interface EscrowTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'fee' | 'refund';
  amount: number;
  currency: string;
  from?: string;
  to?: string;
  status: 'pending' | 'completed' | 'failed';
  paymentId?: string;
  createdAt: string;
}

export interface EscrowEvent {
  id: string;
  type: string;
  description: string;
  userId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DisputeReason {
  code: string;
  description: string;
  evidence?: string[];
}

class EscrowEngine {
  private static instance: EscrowEngine;

  private constructor() {}

  static getInstance(): EscrowEngine {
    if (!EscrowEngine.instance) {
      EscrowEngine.instance = new EscrowEngine();
    }
    return EscrowEngine.instance;
  }

  // Create escrow
  async create(config: EscrowConfig): Promise<Escrow> {
    try {
      // Validate configuration
      this.validateConfig(config);

      // Generate milestones
      const milestones = config.milestones?.map((m, index) => ({
        id: `milestone-${index + 1}`,
        ...m,
        status: MilestoneStatus.PENDING,
        approvedBy: [],
        rejectedBy: [],
      })) || [];

      // Generate conditions
      const conditions = config.conditions?.map((c, index) => ({
        id: `condition-${index + 1}`,
        ...c,
        met: false,
      })) || [];

      const escrowData = {
        type: config.type,
        status: EscrowStatus.DRAFT,
        title: config.title,
        description: config.description,
        amount: config.amount,
        currency: config.currency,
        participants: [config.buyer, config.seller, config.agent, config.arbiter].filter(Boolean),
        milestones,
        conditions,
        settings: {
          auto_release: config.settings?.autoRelease ?? false,
          release_delay: config.settings?.releaseDelay ?? 24,
          requires_buyer_approval: config.settings?.requiresBuyerApproval ?? true,
          requires_seller_confirmation: config.settings?.requiresSellerConfirmation ?? true,
          dispute_period: config.settings?.disputePeriod ?? 7,
          expiry_date: config.settings?.expiryDate,
        },
        transactions: [],
        timeline: [
          {
            id: `event-${Date.now()}`,
            type: 'escrow_created',
            description: 'Escrow created',
            created_at: new Date().toISOString(),
          },
        ],
        metadata: config.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('escrows')
        .insert(escrowData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToEscrow(data);
    } catch (error: any) {
      console.error('Failed to create escrow:', error);
      throw error;
    }
  }

  // Fund escrow
  async fund(escrowId: string, paymentId: string, userId: string): Promise<Escrow> {
    try {
      const escrow = await this.get(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== EscrowStatus.DRAFT && escrow.status !== EscrowStatus.PENDING_FUNDING) {
        throw new Error('Escrow cannot be funded in current status');
      }

      // Record transaction
      const transaction: EscrowTransaction = {
        id: `txn-${Date.now()}`,
        type: 'deposit',
        amount: escrow.amount,
        currency: escrow.currency,
        from: userId,
        status: 'completed',
        paymentId,
        createdAt: new Date().toISOString(),
      };

      // Add event
      const event: EscrowEvent = {
        id: `event-${Date.now()}`,
        type: 'escrow_funded',
        description: 'Escrow funded',
        userId,
        createdAt: new Date().toISOString(),
      };

      await supabase
        .from('escrows')
        .update({
          status: EscrowStatus.FUNDED,
          funded_at: new Date().toISOString(),
          transactions: [...escrow.transactions, transaction],
          timeline: [...escrow.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      return (await this.get(escrowId))!;
    } catch (error: any) {
      console.error('Failed to fund escrow:', error);
      throw error;
    }
  }

  // Start escrow
  async start(escrowId: string, userId: string): Promise<Escrow> {
    try {
      const escrow = await this.get(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== EscrowStatus.FUNDED) {
        throw new Error('Escrow must be funded before starting');
      }

      const event: EscrowEvent = {
        id: `event-${Date.now()}`,
        type: 'escrow_started',
        description: 'Escrow started',
        userId,
        createdAt: new Date().toISOString(),
      };

      await supabase
        .from('escrows')
        .update({
          status: EscrowStatus.IN_PROGRESS,
          timeline: [...escrow.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      return (await this.get(escrowId))!;
    } catch (error: any) {
      console.error('Failed to start escrow:', error);
      throw error;
    }
  }

  // Complete milestone
  async completeMilestone(
    escrowId: string,
    milestoneId: string,
    userId: string
  ): Promise<Escrow> {
    try {
      const escrow = await this.get(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      const milestone = escrow.milestones.find((m) => m.id === milestoneId);

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.status !== MilestoneStatus.PENDING && milestone.status !== MilestoneStatus.IN_PROGRESS) {
        throw new Error('Milestone cannot be completed in current status');
      }

      // Update milestone
      const updatedMilestones = escrow.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, status: MilestoneStatus.COMPLETED, completedAt: new Date().toISOString() }
          : m
      );

      const event: EscrowEvent = {
        id: `event-${Date.now()}`,
        type: 'milestone_completed',
        description: `Milestone "${milestone.title}" completed`,
        userId,
        metadata: { milestoneId },
        createdAt: new Date().toISOString(),
      };

      await supabase
        .from('escrows')
        .update({
          milestones: updatedMilestones,
          timeline: [...escrow.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      return (await this.get(escrowId))!;
    } catch (error: any) {
      console.error('Failed to complete milestone:', error);
      throw error;
    }
  }

  // Approve milestone
  async approveMilestone(
    escrowId: string,
    milestoneId: string,
    userId: string
  ): Promise<Escrow> {
    try {
      const escrow = await this.get(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      const milestone = escrow.milestones.find((m) => m.id === milestoneId);

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.status !== MilestoneStatus.COMPLETED) {
        throw new Error('Milestone must be completed before approval');
      }

      // Update milestone
      const updatedMilestones = escrow.milestones.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              status: MilestoneStatus.APPROVED,
              approvedBy: [...(m.approvedBy || []), userId],
            }
          : m
      );

      const event: EscrowEvent = {
        id: `event-${Date.now()}`,
        type: 'milestone_approved',
        description: `Milestone "${milestone.title}" approved`,
        userId,
        metadata: { milestoneId },
        createdAt: new Date().toISOString(),
      };

      await supabase
        .from('escrows')
        .update({
          milestones: updatedMilestones,
          timeline: [...escrow.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      // Check if all milestones are approved
      const allApproved = updatedMilestones.every(
        (m) => m.status === MilestoneStatus.APPROVED
      );

      if (allApproved) {
        await this.requestRelease(escrowId, userId);
      }

      return (await this.get(escrowId))!;
    } catch (error: any) {
      console.error('Failed to approve milestone:', error);
      throw error;
    }
  }

  // Request release
  async requestRelease(escrowId: string, userId: string): Promise<Escrow> {
    try {
      const escrow = await this.get(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== EscrowStatus.IN_PROGRESS) {
        throw new Error('Escrow must be in progress to request release');
      }

      // Check if all conditions are met
      const allConditionsMet = escrow.conditions.every((c) => !c.required || c.met);

      if (!allConditionsMet) {
        throw new Error('All required conditions must be met before release');
      }

      const event: EscrowEvent = {
        id: `event-${Date.now()}`,
        type: 'release_requested',
        description: 'Release requested',
        userId,
        createdAt: new Date().toISOString(),
      };

      await supabase
        .from('escrows')
        .update({
          status: EscrowStatus.PENDING_RELEASE,
          timeline: [...escrow.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      // Auto release if enabled
      if (escrow.settings.autoRelease) {
        setTimeout(async () => {
          await this.release(escrowId, 'system');
        }, escrow.settings.releaseDelay * 3600000);
      }

      return (await this.get(escrowId))!;
    } catch (error: any) {
      console.error('Failed to request release:', error);
      throw error;
    }
  }

  // Release funds
  async release(escrowId: string, userId: string): Promise<Escrow> {
    try {
      const escrow = await this.get(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== EscrowStatus.PENDING_RELEASE) {
        throw new Error('Escrow must be pending release');
      }

      // Record transaction
      const seller = escrow.participants.find((p) => p.role === ParticipantRole.SELLER);

      const transaction: EscrowTransaction = {
        id: `txn-${Date.now()}`,
        type: 'withdrawal',
        amount: escrow.amount,
        currency: escrow.currency,
        to: seller?.userId,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };

      const event: EscrowEvent = {
        id: `event-${Date.now()}`,
        type: 'funds_released',
        description: 'Funds released to seller',
        userId,
        createdAt: new Date().toISOString(),
      };

      await supabase
        .from('escrows')
        .update({
          status: EscrowStatus.COMPLETED,
          completed_at: new Date().toISOString(),
          transactions: [...escrow.transactions, transaction],
          timeline: [...escrow.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      return (await this.get(escrowId))!;
    } catch (error: any) {
      console.error('Failed to release funds:', error);
      throw error;
    }
  }

  // Dispute escrow
  async dispute(
    escrowId: string,
    userId: string,
    reason: DisputeReason
  ): Promise<Escrow> {
    try {
      const escrow = await this.get(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (
        escrow.status !== EscrowStatus.IN_PROGRESS &&
        escrow.status !== EscrowStatus.PENDING_RELEASE
      ) {
        throw new Error('Escrow cannot be disputed in current status');
      }

      const event: EscrowEvent = {
        id: `event-${Date.now()}`,
        type: 'dispute_raised',
        description: `Dispute raised: ${reason.description}`,
        userId,
        metadata: reason,
        createdAt: new Date().toISOString(),
      };

      await supabase
        .from('escrows')
        .update({
          status: EscrowStatus.DISPUTED,
          timeline: [...escrow.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      return (await this.get(escrowId))!;
    } catch (error: any) {
      console.error('Failed to dispute escrow:', error);
      throw error;
    }
  }

  // Resolve dispute
  async resolveDispute(
    escrowId: string,
    resolution: 'release' | 'refund' | 'partial',
    userId: string,
    amount?: number
  ): Promise<Escrow> {
    try {
      const escrow = await this.get(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== EscrowStatus.DISPUTED) {
        throw new Error('Escrow is not in disputed status');
      }

      const event: EscrowEvent = {
        id: `event-${Date.now()}`,
        type: 'dispute_resolved',
        description: `Dispute resolved: ${resolution}`,
        userId,
        metadata: { resolution, amount },
        createdAt: new Date().toISOString(),
      };

      if (resolution === 'release') {
        await supabase
          .from('escrows')
          .update({
            status: EscrowStatus.PENDING_RELEASE,
            timeline: [...escrow.timeline, event],
            updated_at: new Date().toISOString(),
          })
          .eq('id', escrowId);

        return this.release(escrowId, userId);
      } else if (resolution === 'refund') {
        return this.refund(escrowId, userId);
      }

      return (await this.get(escrowId))!;
    } catch (error: any) {
      console.error('Failed to resolve dispute:', error);
      throw error;
    }
  }

  // Refund escrow
  async refund(escrowId: string, userId: string): Promise<Escrow> {
    try {
      const escrow = await this.get(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      const buyer = escrow.participants.find((p) => p.role === ParticipantRole.BUYER);

      const transaction: EscrowTransaction = {
        id: `txn-${Date.now()}`,
        type: 'refund',
        amount: escrow.amount,
        currency: escrow.currency,
        to: buyer?.userId,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };

      const event: EscrowEvent = {
        id: `event-${Date.now()}`,
        type: 'funds_refunded',
        description: 'Funds refunded to buyer',
        userId,
        createdAt: new Date().toISOString(),
      };

      await supabase
        .from('escrows')
        .update({
          status: EscrowStatus.REFUNDED,
          transactions: [...escrow.transactions, transaction],
          timeline: [...escrow.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      return (await this.get(escrowId))!;
    } catch (error: any) {
      console.error('Failed to refund escrow:', error);
      throw error;
    }
  }

  // Cancel escrow
  async cancel(escrowId: string, userId: string, reason?: string): Promise<Escrow> {
    try {
      const escrow = await this.get(escrowId);

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status === EscrowStatus.COMPLETED || escrow.status === EscrowStatus.REFUNDED) {
        throw new Error('Cannot cancel completed or refunded escrow');
      }

      const event: EscrowEvent = {
        id: `event-${Date.now()}`,
        type: 'escrow_cancelled',
        description: `Escrow cancelled${reason ? `: ${reason}` : ''}`,
        userId,
        createdAt: new Date().toISOString(),
      };

      await supabase
        .from('escrows')
        .update({
          status: EscrowStatus.CANCELLED,
          timeline: [...escrow.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', escrowId);

      // Refund if funded
      if (escrow.status === EscrowStatus.FUNDED || escrow.status === EscrowStatus.IN_PROGRESS) {
        await this.refund(escrowId, userId);
      }

      return (await this.get(escrowId))!;
    } catch (error: any) {
      console.error('Failed to cancel escrow:', error);
      throw error;
    }
  }

  // Get escrow
  async get(escrowId: string): Promise<Escrow | null> {
    try {
      const { data, error } = await supabase
        .from('escrows')
        .select('*')
        .eq('id', escrowId)
        .single();

      if (error || !data) return null;

      return this.mapToEscrow(data);
    } catch (error) {
      console.error('Failed to get escrow:', error);
      return null;
    }
  }

  // List escrows
  async list(options: {
    userId?: string;
    status?: EscrowStatus;
    type?: EscrowType;
    limit?: number;
  } = {}): Promise<Escrow[]> {
    try {
      let query = supabase.from('escrows').select('*');

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.type) {
        query = query.eq('type', options.type);
      }

      query = query.order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      let escrows = (data || []).map(this.mapToEscrow);

      // Filter by user if specified
      if (options.userId) {
        escrows = escrows.filter((e) =>
          e.participants.some((p) => p.userId === options.userId)
        );
      }

      return escrows;
    } catch (error) {
      console.error('Failed to list escrows:', error);
      return [];
    }
  }

  // Validate config
  private validateConfig(config: EscrowConfig): void {
    if (!config.title) {
      throw new Error('Title is required');
    }

    if (config.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!config.buyer || !config.seller) {
      throw new Error('Buyer and seller are required');
    }

    if (config.type === EscrowType.MILESTONE && (!config.milestones || config.milestones.length === 0)) {
      throw new Error('Milestones are required for milestone escrow');
    }
  }

  // Map database record to Escrow
  private mapToEscrow(data: any): Escrow {
    return {
      id: data.id,
      type: data.type,
      status: data.status,
      title: data.title,
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      participants: data.participants,
      milestones: data.milestones,
      conditions: data.conditions,
      settings: data.settings,
      transactions: data.transactions,
      timeline: data.timeline,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      fundedAt: data.funded_at,
      completedAt: data.completed_at,
    };
  }
}

// Export singleton instance
export const escrowEngine = EscrowEngine.getInstance();

// Convenience functions
export const createEscrow = (config: EscrowConfig) => escrowEngine.create(config);
export const fundEscrow = (escrowId: string, paymentId: string, userId: string) =>
  escrowEngine.fund(escrowId, paymentId, userId);
export const releaseEscrow = (escrowId: string, userId: string) =>
  escrowEngine.release(escrowId, userId);
export const disputeEscrow = (escrowId: string, userId: string, reason: DisputeReason) =>
  escrowEngine.dispute(escrowId, userId, reason);
export const getEscrow = (escrowId: string) => escrowEngine.get(escrowId);
