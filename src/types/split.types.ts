/**
 * Split Types
 * Comprehensive type definitions for split payment operations
 */

/**
 * Recipient information
 */
export interface Recipient {
  id: string;
  address: string;
  name?: string;
  ensName?: string;
  avatar?: string;
  percentage: number;
  amount?: number;
  verified?: boolean;
}

/**
 * Split status
 */
export type SplitStatus = 
  | 'draft'
  | 'pending'
  | 'active'
  | 'distributing'
  | 'completed'
  | 'cancelled';

/**
 * Recipient status
 */
export type RecipientStatus = 
  | 'pending'
  | 'claimable'
  | 'claimed'
  | 'sent'
  | 'failed';

/**
 * Release type
 */
export type ReleaseType = 
  | 'immediate'
  | 'scheduled'
  | 'milestone'
  | 'escrow'
  | 'streaming';

/**
 * Split configuration
 */
export interface SplitConfig {
  totalAmount: number;
  currency: string;
  chainId: number;
  recipients: Recipient[];
  releaseType: ReleaseType;
  scheduledDate?: Date;
  milestones?: Milestone[];
  streamDuration?: number;
  escrowReleaseConditions?: EscrowCondition[];
}

/**
 * Split record
 */
export interface Split {
  id: string;
  creator: string;
  config: SplitConfig;
  recipients: SplitRecipient[];
  status: SplitStatus;
  createdAt: Date;
  activatedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  transactionHash?: string;
  contractAddress?: string;
}

/**
 * Split recipient with status
 */
export interface SplitRecipient {
  address: string;
  name?: string;
  percentage: number;
  amount: number;
  status: RecipientStatus;
  claimedAt?: Date;
  transactionHash?: string;
}

/**
 * Milestone definition
 */
export interface Milestone {
  id: string;
  title: string;
  description?: string;
  percentage: number;
  amount: number;
  dueDate?: Date;
  status: 'pending' | 'approved' | 'released' | 'disputed';
  approvedBy?: string;
  approvedAt?: Date;
}

/**
 * Escrow condition
 */
export interface EscrowCondition {
  id: string;
  type: 'time' | 'approval' | 'oracle' | 'multisig';
  description: string;
  params: Record<string, unknown>;
  isMet: boolean;
  metAt?: Date;
}

/**
 * Stream parameters
 */
export interface StreamParams {
  startTime: Date;
  endTime: Date;
  totalAmount: number;
  claimedAmount: number;
  claimableAmount: number;
  lastClaimTime?: Date;
}

/**
 * Claim request
 */
export interface ClaimRequest {
  splitId: string;
  recipientAddress: string;
  amount: number;
  timestamp: Date;
}

/**
 * Claim result
 */
export interface ClaimResult {
  success: boolean;
  splitId: string;
  recipientAddress: string;
  amount: number;
  transactionHash?: string;
  error?: string;
}

/**
 * Split history item
 */
export interface SplitHistoryItem {
  id: string;
  splitId: string;
  action: SplitAction;
  actor: string;
  timestamp: Date;
  details: Record<string, unknown>;
  transactionHash?: string;
}

/**
 * Split actions
 */
export type SplitAction =
  | 'created'
  | 'activated'
  | 'funded'
  | 'released'
  | 'claimed'
  | 'milestone_approved'
  | 'cancelled'
  | 'completed';

/**
 * Split statistics
 */
export interface SplitStatistics {
  totalSplits: number;
  activeSplits: number;
  completedSplits: number;
  totalVolume: number;
  totalDistributed: number;
  uniqueRecipients: number;
  averageSplitSize: number;
  averageRecipients: number;
}

/**
 * User split summary
 */
export interface UserSplitSummary {
  address: string;
  asCreator: {
    totalCreated: number;
    activeSplits: number;
    totalDistributed: number;
  };
  asRecipient: {
    totalReceived: number;
    pendingClaims: number;
    totalClaimed: number;
  };
}

/**
 * Split error
 */
export interface SplitError {
  code: SplitErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type SplitErrorCode =
  | 'INVALID_RECIPIENTS'
  | 'INVALID_PERCENTAGES'
  | 'INSUFFICIENT_FUNDS'
  | 'SPLIT_NOT_FOUND'
  | 'NOT_CLAIMABLE'
  | 'ALREADY_CLAIMED'
  | 'NOT_AUTHORIZED'
  | 'TRANSACTION_FAILED'
  | 'UNKNOWN_ERROR';

/**
 * Split event
 */
export interface SplitEvent {
  id: string;
  type: SplitAction;
  splitId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Distribution preview
 */
export interface DistributionPreview {
  totalAmount: number;
  currency: string;
  recipients: Array<{
    address: string;
    name?: string;
    percentage: number;
    amount: number;
  }>;
  fee: number;
  netDistribution: number;
}

