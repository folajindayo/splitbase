/**
 * Split Service
 * Handle split payment creation, management, and distribution
 */

export interface Recipient {
  id: string;
  address: string;
  name?: string;
  percentage: number;
  amount?: number;
}

export interface Split {
  id: string;
  creator: string;
  totalAmount: number;
  currency: string;
  recipients: SplitRecipient[];
  status: SplitStatus;
  releaseType: ReleaseType;
  scheduledDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  transactionHash?: string;
}

export interface SplitRecipient {
  address: string;
  name?: string;
  percentage: number;
  amount: number;
  status: RecipientStatus;
  claimedAt?: Date;
  transactionHash?: string;
}

export type SplitStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type RecipientStatus = 'pending' | 'claimable' | 'claimed' | 'sent';
export type ReleaseType = 'immediate' | 'scheduled' | 'milestone' | 'escrow';

export interface SplitConfig {
  minRecipients: number;
  maxRecipients: number;
  minAmount: number;
  feePercent: number;
}

// Default configuration
const DEFAULT_CONFIG: SplitConfig = {
  minRecipients: 2,
  maxRecipients: 100,
  minAmount: 0.001,
  feePercent: 0.5,
};

// In-memory store
const splits: Map<string, Split> = new Map();
const splitsByCreator: Map<string, Set<string>> = new Map();

class SplitService {
  private config: SplitConfig;

  constructor(config: Partial<SplitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new split
   */
  createSplit(params: {
    creator: string;
    totalAmount: number;
    currency: string;
    recipients: Recipient[];
    releaseType: ReleaseType;
    scheduledDate?: Date;
  }): Split {
    // Validate
    this.validateSplit(params);

    // Calculate amounts
    const splitRecipients: SplitRecipient[] = params.recipients.map(r => ({
      address: r.address,
      name: r.name,
      percentage: r.percentage,
      amount: (params.totalAmount * r.percentage) / 100,
      status: params.releaseType === 'immediate' ? 'sent' : 'pending',
    }));

    const split: Split = {
      id: this.generateId(),
      creator: params.creator,
      totalAmount: params.totalAmount,
      currency: params.currency,
      recipients: splitRecipients,
      status: params.releaseType === 'immediate' ? 'completed' : 'active',
      releaseType: params.releaseType,
      scheduledDate: params.scheduledDate,
      createdAt: new Date(),
      completedAt: params.releaseType === 'immediate' ? new Date() : undefined,
    };

    // Store
    splits.set(split.id, split);
    
    const creatorSplits = splitsByCreator.get(params.creator) || new Set();
    creatorSplits.add(split.id);
    splitsByCreator.set(params.creator, creatorSplits);

    return split;
  }

  /**
   * Validate split parameters
   */
  private validateSplit(params: {
    recipients: Recipient[];
    totalAmount: number;
  }): void {
    // Check recipient count
    if (params.recipients.length < this.config.minRecipients) {
      throw new Error(`Minimum ${this.config.minRecipients} recipients required`);
    }
    if (params.recipients.length > this.config.maxRecipients) {
      throw new Error(`Maximum ${this.config.maxRecipients} recipients allowed`);
    }

    // Check amount
    if (params.totalAmount < this.config.minAmount) {
      throw new Error(`Minimum amount is ${this.config.minAmount}`);
    }

    // Check percentages sum to 100
    const totalPercentage = params.recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Recipient percentages must sum to 100%');
    }

    // Check for duplicate addresses
    const addresses = new Set<string>();
    for (const r of params.recipients) {
      const lower = r.address.toLowerCase();
      if (addresses.has(lower)) {
        throw new Error('Duplicate recipient addresses not allowed');
      }
      addresses.add(lower);
    }
  }

  /**
   * Get split by ID
   */
  getSplit(id: string): Split | null {
    return splits.get(id) || null;
  }

  /**
   * Get splits by creator
   */
  getSplitsByCreator(creator: string): Split[] {
    const ids = splitsByCreator.get(creator);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => splits.get(id))
      .filter((s): s is Split => s !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get splits where address is recipient
   */
  getSplitsAsRecipient(address: string): Split[] {
    const lowerAddress = address.toLowerCase();
    return Array.from(splits.values())
      .filter(s => s.recipients.some(r => r.address.toLowerCase() === lowerAddress))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Release funds to recipients
   */
  async releaseFunds(splitId: string): Promise<Split> {
    const split = this.getSplit(splitId);
    if (!split) {
      throw new Error('Split not found');
    }
    if (split.status !== 'active') {
      throw new Error('Split is not active');
    }

    // Update recipient statuses
    for (const recipient of split.recipients) {
      recipient.status = 'claimable';
    }

    split.status = 'active';
    return split;
  }

  /**
   * Claim funds for a recipient
   */
  async claimFunds(splitId: string, recipientAddress: string): Promise<SplitRecipient> {
    const split = this.getSplit(splitId);
    if (!split) {
      throw new Error('Split not found');
    }

    const recipient = split.recipients.find(
      r => r.address.toLowerCase() === recipientAddress.toLowerCase()
    );
    if (!recipient) {
      throw new Error('Recipient not found in split');
    }
    if (recipient.status !== 'claimable') {
      throw new Error('Funds not claimable');
    }

    // Process claim
    recipient.status = 'claimed';
    recipient.claimedAt = new Date();
    recipient.transactionHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    // Check if all claimed
    if (split.recipients.every(r => r.status === 'claimed')) {
      split.status = 'completed';
      split.completedAt = new Date();
    }

    return recipient;
  }

  /**
   * Cancel a split
   */
  cancelSplit(splitId: string, requester: string): Split {
    const split = this.getSplit(splitId);
    if (!split) {
      throw new Error('Split not found');
    }
    if (split.creator.toLowerCase() !== requester.toLowerCase()) {
      throw new Error('Only creator can cancel');
    }
    if (split.status === 'completed') {
      throw new Error('Cannot cancel completed split');
    }

    split.status = 'cancelled';
    return split;
  }

  /**
   * Calculate fee for amount
   */
  calculateFee(amount: number): number {
    return (amount * this.config.feePercent) / 100;
  }

  /**
   * Get configuration
   */
  getConfig(): SplitConfig {
    return { ...this.config };
  }
}

// Export singleton
export const splitService = new SplitService();
export { SplitService };
export default splitService;

