/**
 * Escrow Types
 * Type definitions for escrow payment operations
 */

/**
 * Escrow status
 */
export type EscrowStatus =
  | 'pending'
  | 'funded'
  | 'releasing'
  | 'released'
  | 'disputed'
  | 'resolved'
  | 'refunded'
  | 'expired'
  | 'cancelled';

/**
 * Release condition type
 */
export type ReleaseConditionType =
  | 'time'
  | 'approval'
  | 'milestone'
  | 'multisig'
  | 'oracle'
  | 'custom';

/**
 * Escrow
 */
export interface Escrow {
  id: string;
  contractAddress: string;
  creator: string;
  beneficiary: string;
  arbiter?: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  releaseConditions: ReleaseCondition[];
  fundedAt?: Date;
  releasesAt?: Date;
  releasedAt?: Date;
  expiresAt?: Date;
  transactionHash?: string;
  metadata?: EscrowMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Release condition
 */
export interface ReleaseCondition {
  id: string;
  type: ReleaseConditionType;
  description: string;
  isMet: boolean;
  metAt?: Date;
  params: ReleaseConditionParams;
}

/**
 * Release condition parameters
 */
export interface ReleaseConditionParams {
  // Time-based
  releaseTimestamp?: number;
  
  // Approval-based
  requiredApprovals?: number;
  approvers?: string[];
  currentApprovals?: string[];
  
  // Milestone-based
  milestoneId?: string;
  milestoneName?: string;
  
  // Multisig
  threshold?: number;
  signers?: string[];
  signatures?: string[];
  
  // Oracle
  oracleAddress?: string;
  oracleCondition?: string;
  
  // Custom
  customData?: Record<string, unknown>;
}

/**
 * Escrow metadata
 */
export interface EscrowMetadata {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  externalId?: string;
  documents?: EscrowDocument[];
  parties?: EscrowParty[];
}

/**
 * Escrow document
 */
export interface EscrowDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  hash?: string;
  uploadedAt: Date;
}

/**
 * Escrow party
 */
export interface EscrowParty {
  address: string;
  role: 'creator' | 'beneficiary' | 'arbiter' | 'approver';
  name?: string;
  email?: string;
  hasApproved?: boolean;
}

/**
 * Create escrow request
 */
export interface CreateEscrowRequest {
  beneficiary: string;
  amount: number;
  currency: string;
  releaseConditions: Omit<ReleaseCondition, 'id' | 'isMet' | 'metAt'>[];
  arbiter?: string;
  expiresAt?: Date;
  metadata?: Omit<EscrowMetadata, 'documents'>;
}

/**
 * Escrow event
 */
export interface EscrowEvent {
  id: string;
  escrowId: string;
  type: EscrowEventType;
  actor: string;
  data?: Record<string, unknown>;
  transactionHash?: string;
  timestamp: Date;
}

/**
 * Escrow event type
 */
export type EscrowEventType =
  | 'created'
  | 'funded'
  | 'condition_met'
  | 'approval_given'
  | 'approval_revoked'
  | 'release_requested'
  | 'released'
  | 'disputed'
  | 'dispute_resolved'
  | 'refunded'
  | 'expired'
  | 'cancelled';

/**
 * Dispute
 */
export interface EscrowDispute {
  id: string;
  escrowId: string;
  initiator: string;
  reason: string;
  evidence?: DisputeEvidence[];
  status: DisputeStatus;
  resolution?: DisputeResolution;
  createdAt: Date;
  resolvedAt?: Date;
}

/**
 * Dispute status
 */
export type DisputeStatus =
  | 'open'
  | 'under_review'
  | 'awaiting_response'
  | 'resolved';

/**
 * Dispute evidence
 */
export interface DisputeEvidence {
  id: string;
  type: 'document' | 'image' | 'text' | 'link';
  content: string;
  submittedBy: string;
  submittedAt: Date;
}

/**
 * Dispute resolution
 */
export interface DisputeResolution {
  decision: 'release_to_beneficiary' | 'refund_to_creator' | 'split';
  splitRatio?: { creator: number; beneficiary: number };
  reason: string;
  resolvedBy: string;
  transactionHash?: string;
}

/**
 * Escrow summary
 */
export interface EscrowSummary {
  totalEscrows: number;
  totalValue: number;
  activeEscrows: number;
  activeValue: number;
  completedEscrows: number;
  completedValue: number;
  disputedEscrows: number;
  currency: string;
}

/**
 * Escrow filters
 */
export interface EscrowFilters {
  status?: EscrowStatus | EscrowStatus[];
  role?: 'creator' | 'beneficiary' | 'arbiter';
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: Date;
  dateTo?: Date;
  currency?: string;
  search?: string;
}

/**
 * Escrow template
 */
export interface EscrowTemplate {
  id: string;
  name: string;
  description?: string;
  releaseConditions: Omit<ReleaseCondition, 'id' | 'isMet' | 'metAt'>[];
  defaultAmount?: number;
  currency: string;
  expirationDays?: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
}

