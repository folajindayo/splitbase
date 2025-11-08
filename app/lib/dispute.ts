import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  EVIDENCE_COLLECTION = 'evidence_collection',
  ARBITRATION = 'arbitration',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

export enum DisputeType {
  NON_DELIVERY = 'non_delivery',
  ITEM_NOT_AS_DESCRIBED = 'item_not_as_described',
  QUALITY_ISSUE = 'quality_issue',
  DELAYED_DELIVERY = 'delayed_delivery',
  WRONG_ITEM = 'wrong_item',
  PAYMENT_ISSUE = 'payment_issue',
  BREACH_OF_CONTRACT = 'breach_of_contract',
  FRAUD = 'fraud',
  OTHER = 'other',
}

export enum DisputeResolution {
  REFUND_BUYER = 'refund_buyer',
  RELEASE_SELLER = 'release_seller',
  PARTIAL_REFUND = 'partial_refund',
  REWORK = 'rework',
  REPLACEMENT = 'replacement',
  COMPROMISE = 'compromise',
  DISMISSED = 'dismissed',
}

export enum EvidenceType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  SCREENSHOT = 'screenshot',
  CHAT_LOG = 'chat_log',
  EMAIL = 'email',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  TRACKING = 'tracking',
  OTHER = 'other',
}

export interface Dispute {
  id: string;
  escrowId: string;
  type: DisputeType;
  status: DisputeStatus;
  claimant: {
    userId: string;
    name: string;
    role: 'buyer' | 'seller';
  };
  respondent: {
    userId: string;
    name: string;
    role: 'buyer' | 'seller';
  };
  amount: number;
  currency: string;
  reason: string;
  description: string;
  evidence: Evidence[];
  timeline: DisputeEvent[];
  arbiter?: {
    userId: string;
    name: string;
    assignedAt: string;
  };
  resolution?: {
    type: DisputeResolution;
    amount?: number;
    reason: string;
    decidedBy: string;
    decidedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  deadline?: string;
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  submittedBy: string;
  submittedAt: string;
  verified: boolean;
}

export interface DisputeEvent {
  id: string;
  type: string;
  description: string;
  userId?: string;
  data?: Record<string, any>;
  timestamp: string;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderName: string;
  message: string;
  attachments?: string[];
  timestamp: string;
  read: boolean;
}

export interface DisputeStatistics {
  total: number;
  open: number;
  resolved: number;
  averageResolutionTime: number;
  byType: Record<DisputeType, number>;
  byResolution: Record<DisputeResolution, number>;
  resolutionRate: number;
}

class DisputeResolutionSystem {
  private static instance: DisputeResolutionSystem;
  private readonly DEFAULT_DEADLINE_DAYS = 14;
  private readonly EVIDENCE_COLLECTION_DAYS = 7;

  private constructor() {}

  static getInstance(): DisputeResolutionSystem {
    if (!DisputeResolutionSystem.instance) {
      DisputeResolutionSystem.instance = new DisputeResolutionSystem();
    }
    return DisputeResolutionSystem.instance;
  }

  // Create dispute
  async create(data: {
    escrowId: string;
    type: DisputeType;
    claimant: { userId: string; name: string; role: 'buyer' | 'seller' };
    respondent: { userId: string; name: string; role: 'buyer' | 'seller' };
    amount: number;
    currency: string;
    reason: string;
    description: string;
  }): Promise<Dispute> {
    try {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + this.DEFAULT_DEADLINE_DAYS);

      const disputeData = {
        escrow_id: data.escrowId,
        type: data.type,
        status: DisputeStatus.OPEN,
        claimant: data.claimant,
        respondent: data.respondent,
        amount: data.amount,
        currency: data.currency,
        reason: data.reason,
        description: data.description,
        evidence: [],
        timeline: [
          {
            id: `event-${Date.now()}`,
            type: 'dispute_created',
            description: 'Dispute created',
            userId: data.claimant.userId,
            timestamp: new Date().toISOString(),
          },
        ],
        deadline: deadline.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: dispute, error } = await supabase
        .from('disputes')
        .insert(disputeData)
        .select()
        .single();

      if (error) throw error;

      // Notify respondent
      await this.notifyParticipant(
        data.respondent.userId,
        'New dispute',
        `A dispute has been raised against you for escrow ${data.escrowId}`
      );

      return this.mapToDispute(dispute);
    } catch (error: any) {
      console.error('Failed to create dispute:', error);
      throw error;
    }
  }

  // Get dispute
  async get(disputeId: string): Promise<Dispute | null> {
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('id', disputeId)
        .single();

      if (error || !data) return null;

      return this.mapToDispute(data);
    } catch (error) {
      console.error('Failed to get dispute:', error);
      return null;
    }
  }

  // List disputes
  async list(filter: {
    escrowId?: string;
    userId?: string;
    status?: DisputeStatus;
    type?: DisputeType;
    limit?: number;
  } = {}): Promise<Dispute[]> {
    try {
      let query = supabase.from('disputes').select('*');

      if (filter.escrowId) {
        query = query.eq('escrow_id', filter.escrowId);
      }

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

      let disputes = (data || []).map(this.mapToDispute);

      // Filter by user if specified
      if (filter.userId) {
        disputes = disputes.filter(
          (d) =>
            d.claimant.userId === filter.userId ||
            d.respondent.userId === filter.userId ||
            d.arbiter?.userId === filter.userId
        );
      }

      return disputes;
    } catch (error) {
      console.error('Failed to list disputes:', error);
      return [];
    }
  }

  // Submit evidence
  async submitEvidence(
    disputeId: string,
    evidence: {
      type: EvidenceType;
      title: string;
      description?: string;
      fileUrl: string;
      fileName: string;
      fileSize: number;
      submittedBy: string;
    }
  ): Promise<Evidence> {
    try {
      const dispute = await this.get(disputeId);

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      const evidenceData: Evidence = {
        id: `evidence-${Date.now()}`,
        type: evidence.type,
        title: evidence.title,
        description: evidence.description,
        fileUrl: evidence.fileUrl,
        fileName: evidence.fileName,
        fileSize: evidence.fileSize,
        submittedBy: evidence.submittedBy,
        submittedAt: new Date().toISOString(),
        verified: false,
      };

      const updatedEvidence = [...dispute.evidence, evidenceData];

      const event: DisputeEvent = {
        id: `event-${Date.now()}`,
        type: 'evidence_submitted',
        description: `Evidence "${evidence.title}" submitted`,
        userId: evidence.submittedBy,
        data: { evidenceId: evidenceData.id },
        timestamp: new Date().toISOString(),
      };

      await supabase
        .from('disputes')
        .update({
          evidence: updatedEvidence,
          timeline: [...dispute.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      return evidenceData;
    } catch (error: any) {
      console.error('Failed to submit evidence:', error);
      throw error;
    }
  }

  // Verify evidence
  async verifyEvidence(disputeId: string, evidenceId: string): Promise<boolean> {
    try {
      const dispute = await this.get(disputeId);

      if (!dispute) return false;

      const updatedEvidence = dispute.evidence.map((e) =>
        e.id === evidenceId ? { ...e, verified: true } : e
      );

      const { error } = await supabase
        .from('disputes')
        .update({
          evidence: updatedEvidence,
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      return !error;
    } catch (error) {
      console.error('Failed to verify evidence:', error);
      return false;
    }
  }

  // Assign arbiter
  async assignArbiter(
    disputeId: string,
    arbiter: { userId: string; name: string }
  ): Promise<boolean> {
    try {
      const dispute = await this.get(disputeId);

      if (!dispute) return false;

      const event: DisputeEvent = {
        id: `event-${Date.now()}`,
        type: 'arbiter_assigned',
        description: `Arbiter ${arbiter.name} assigned`,
        userId: arbiter.userId,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('disputes')
        .update({
          status: DisputeStatus.UNDER_REVIEW,
          arbiter: {
            userId: arbiter.userId,
            name: arbiter.name,
            assignedAt: new Date().toISOString(),
          },
          timeline: [...dispute.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      if (error) throw error;

      // Notify arbiter
      await this.notifyParticipant(
        arbiter.userId,
        'Dispute assignment',
        `You have been assigned to dispute ${disputeId}`
      );

      return true;
    } catch (error) {
      console.error('Failed to assign arbiter:', error);
      return false;
    }
  }

  // Resolve dispute
  async resolve(
    disputeId: string,
    resolution: {
      type: DisputeResolution;
      amount?: number;
      reason: string;
      decidedBy: string;
    }
  ): Promise<boolean> {
    try {
      const dispute = await this.get(disputeId);

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      const event: DisputeEvent = {
        id: `event-${Date.now()}`,
        type: 'dispute_resolved',
        description: `Dispute resolved: ${resolution.type}`,
        userId: resolution.decidedBy,
        data: resolution,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('disputes')
        .update({
          status: DisputeStatus.RESOLVED,
          resolution: {
            type: resolution.type,
            amount: resolution.amount,
            reason: resolution.reason,
            decidedBy: resolution.decidedBy,
            decidedAt: new Date().toISOString(),
          },
          timeline: [...dispute.timeline, event],
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      if (error) throw error;

      // Notify participants
      await this.notifyParticipant(
        dispute.claimant.userId,
        'Dispute resolved',
        `Dispute ${disputeId} has been resolved`
      );

      await this.notifyParticipant(
        dispute.respondent.userId,
        'Dispute resolved',
        `Dispute ${disputeId} has been resolved`
      );

      return true;
    } catch (error: any) {
      console.error('Failed to resolve dispute:', error);
      throw error;
    }
  }

  // Close dispute
  async close(disputeId: string, userId: string): Promise<boolean> {
    try {
      const dispute = await this.get(disputeId);

      if (!dispute) return false;

      const event: DisputeEvent = {
        id: `event-${Date.now()}`,
        type: 'dispute_closed',
        description: 'Dispute closed',
        userId,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('disputes')
        .update({
          status: DisputeStatus.CLOSED,
          timeline: [...dispute.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      return !error;
    } catch (error) {
      console.error('Failed to close dispute:', error);
      return false;
    }
  }

  // Escalate dispute
  async escalate(disputeId: string, reason: string, userId: string): Promise<boolean> {
    try {
      const dispute = await this.get(disputeId);

      if (!dispute) return false;

      const event: DisputeEvent = {
        id: `event-${Date.now()}`,
        type: 'dispute_escalated',
        description: `Dispute escalated: ${reason}`,
        userId,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('disputes')
        .update({
          status: DisputeStatus.ESCALATED,
          timeline: [...dispute.timeline, event],
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      return !error;
    } catch (error) {
      console.error('Failed to escalate dispute:', error);
      return false;
    }
  }

  // Send message
  async sendMessage(
    disputeId: string,
    message: {
      senderId: string;
      senderName: string;
      message: string;
      attachments?: string[];
    }
  ): Promise<DisputeMessage> {
    try {
      const messageData = {
        dispute_id: disputeId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        message: message.message,
        attachments: message.attachments,
        timestamp: new Date().toISOString(),
        read: false,
      };

      const { data, error } = await supabase
        .from('dispute_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        disputeId: data.dispute_id,
        senderId: data.sender_id,
        senderName: data.sender_name,
        message: data.message,
        attachments: data.attachments,
        timestamp: data.timestamp,
        read: data.read,
      };
    } catch (error: any) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Get messages
  async getMessages(disputeId: string): Promise<DisputeMessage[]> {
    try {
      const { data, error } = await supabase
        .from('dispute_messages')
        .select('*')
        .eq('dispute_id', disputeId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return (data || []).map((msg) => ({
        id: msg.id,
        disputeId: msg.dispute_id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        message: msg.message,
        attachments: msg.attachments,
        timestamp: msg.timestamp,
        read: msg.read,
      }));
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  // Get statistics
  async getStatistics(filter: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<DisputeStatistics> {
    try {
      let query = supabase.from('disputes').select('*');

      if (filter.startDate) {
        query = query.gte('created_at', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('created_at', filter.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats: DisputeStatistics = {
        total: data?.length || 0,
        open: 0,
        resolved: 0,
        averageResolutionTime: 0,
        byType: {} as Record<DisputeType, number>,
        byResolution: {} as Record<DisputeResolution, number>,
        resolutionRate: 0,
      };

      let totalResolutionTime = 0;

      data?.forEach((dispute) => {
        if (dispute.status === DisputeStatus.OPEN) {
          stats.open++;
        } else if (dispute.status === DisputeStatus.RESOLVED) {
          stats.resolved++;

          if (dispute.resolved_at) {
            const created = new Date(dispute.created_at).getTime();
            const resolved = new Date(dispute.resolved_at).getTime();
            totalResolutionTime += resolved - created;
          }

          if (dispute.resolution?.type) {
            stats.byResolution[dispute.resolution.type] =
              (stats.byResolution[dispute.resolution.type] || 0) + 1;
          }
        }

        stats.byType[dispute.type as DisputeType] =
          (stats.byType[dispute.type as DisputeType] || 0) + 1;
      });

      if (stats.resolved > 0) {
        stats.averageResolutionTime = totalResolutionTime / stats.resolved;
      }

      stats.resolutionRate = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;

      return stats;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        total: 0,
        open: 0,
        resolved: 0,
        averageResolutionTime: 0,
        byType: {} as any,
        byResolution: {} as any,
        resolutionRate: 0,
      };
    }
  }

  // Notify participant
  private async notifyParticipant(
    userId: string,
    subject: string,
    message: string
  ): Promise<void> {
    // Implementation would send notifications
    console.log(`Notify ${userId}: ${subject} - ${message}`);
  }

  // Map database record to Dispute
  private mapToDispute(data: any): Dispute {
    return {
      id: data.id,
      escrowId: data.escrow_id,
      type: data.type,
      status: data.status,
      claimant: data.claimant,
      respondent: data.respondent,
      amount: data.amount,
      currency: data.currency,
      reason: data.reason,
      description: data.description,
      evidence: data.evidence || [],
      timeline: data.timeline || [],
      arbiter: data.arbiter,
      resolution: data.resolution,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      resolvedAt: data.resolved_at,
      deadline: data.deadline,
    };
  }
}

// Export singleton instance
export const disputeResolution = DisputeResolutionSystem.getInstance();

// Convenience functions
export const createDispute = (data: any) => disputeResolution.create(data);
export const getDispute = (disputeId: string) => disputeResolution.get(disputeId);
export const resolveDispute = (disputeId: string, resolution: any) =>
  disputeResolution.resolve(disputeId, resolution);
export const submitEvidence = (disputeId: string, evidence: any) =>
  disputeResolution.submitEvidence(disputeId, evidence);
export const assignArbiter = (disputeId: string, arbiter: any) =>
  disputeResolution.assignArbiter(disputeId, arbiter);

