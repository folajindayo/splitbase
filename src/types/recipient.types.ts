/**
 * Recipient Types
 * Type definitions for payment recipients
 */

/**
 * Recipient status
 */
export type RecipientStatus = 
  | 'active'
  | 'pending'
  | 'suspended'
  | 'removed';

/**
 * Recipient type
 */
export type RecipientType = 
  | 'individual'
  | 'organization'
  | 'contract'
  | 'multisig';

/**
 * Recipient
 */
export interface Recipient {
  id: string;
  address: string;
  name: string;
  email?: string;
  type: RecipientType;
  status: RecipientStatus;
  share: number;
  shareType: 'percentage' | 'fixed';
  vestingSchedule?: VestingSchedule;
  claimSettings: ClaimSettings;
  totalReceived: number;
  totalPending: number;
  lastClaimedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Vesting schedule
 */
export interface VestingSchedule {
  id: string;
  type: 'linear' | 'cliff' | 'milestone' | 'custom';
  startDate: Date;
  endDate: Date;
  cliffDate?: Date;
  cliffAmount?: number;
  totalAmount: number;
  vestedAmount: number;
  claimedAmount: number;
  vestingPeriod: number;
  vestingInterval: number;
  milestones?: VestingMilestone[];
}

/**
 * Vesting milestone
 */
export interface VestingMilestone {
  id: string;
  name: string;
  description?: string;
  percentage: number;
  amount: number;
  targetDate?: Date;
  completedAt?: Date;
  status: 'pending' | 'completed' | 'cancelled';
}

/**
 * Claim settings
 */
export interface ClaimSettings {
  autoClaimEnabled: boolean;
  autoClaimThreshold?: number;
  autoClaimFrequency?: 'daily' | 'weekly' | 'monthly';
  requiresApproval: boolean;
  approvers?: string[];
  minClaimAmount?: number;
  maxClaimAmount?: number;
}

/**
 * Recipient group
 */
export interface RecipientGroup {
  id: string;
  name: string;
  description?: string;
  recipients: Recipient[];
  totalShare: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create recipient request
 */
export interface CreateRecipientRequest {
  address: string;
  name: string;
  email?: string;
  type?: RecipientType;
  share: number;
  shareType?: 'percentage' | 'fixed';
  vestingSchedule?: Omit<VestingSchedule, 'id' | 'vestedAmount' | 'claimedAmount'>;
  claimSettings?: Partial<ClaimSettings>;
  metadata?: Record<string, unknown>;
}

/**
 * Update recipient request
 */
export interface UpdateRecipientRequest {
  id: string;
  name?: string;
  email?: string;
  share?: number;
  status?: RecipientStatus;
  claimSettings?: Partial<ClaimSettings>;
  metadata?: Record<string, unknown>;
}

/**
 * Recipient payment record
 */
export interface RecipientPayment {
  id: string;
  recipientId: string;
  splitId: string;
  amount: number;
  currency: string;
  type: 'distribution' | 'claim' | 'vesting';
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  blockNumber?: number;
  timestamp: Date;
}

/**
 * Recipient statistics
 */
export interface RecipientStats {
  recipientId: string;
  totalReceived: number;
  totalPending: number;
  totalClaimed: number;
  totalDistributions: number;
  averageDistribution: number;
  lastPaymentDate?: Date;
  currency: string;
}

/**
 * Recipient list filters
 */
export interface RecipientFilters {
  status?: RecipientStatus | RecipientStatus[];
  type?: RecipientType | RecipientType[];
  minShare?: number;
  maxShare?: number;
  hasVesting?: boolean;
  search?: string;
}

/**
 * Recipient import data
 */
export interface RecipientImportData {
  address: string;
  name: string;
  share: number;
  email?: string;
}

/**
 * Recipient import result
 */
export interface RecipientImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: {
    row: number;
    field: string;
    message: string;
  }[];
  recipients: Recipient[];
}

/**
 * Recipient verification
 */
export interface RecipientVerification {
  id: string;
  recipientId: string;
  type: 'address' | 'identity' | 'organization';
  status: 'pending' | 'verified' | 'failed';
  verifiedAt?: Date;
  expiresAt?: Date;
  verificationData?: Record<string, unknown>;
}

