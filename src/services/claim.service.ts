/**
 * Claim Service
 * Handle payment claim operations
 */

export interface Claim {
  id: string;
  splitId: string;
  recipientAddress: string;
  amount: number;
  currency: string;
  status: ClaimStatus;
  transactionHash?: string;
  blockNumber?: number;
  requestedAt: Date;
  processedAt?: Date;
  expiresAt?: Date;
  signature?: string;
  metadata?: Record<string, unknown>;
}

export type ClaimStatus = 
  | 'pending'
  | 'processing'
  | 'confirmed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export interface ClaimRequest {
  splitId: string;
  recipientAddress: string;
  amount?: number; // If not provided, claim all available
}

export interface ClaimBatch {
  id: string;
  claims: Claim[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  transactionHash?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ClaimableBalance {
  splitId: string;
  recipientAddress: string;
  totalClaimable: number;
  totalClaimed: number;
  pendingClaims: number;
  currency: string;
  lastClaimAt?: Date;
}

class ClaimService {
  private claims: Map<string, Claim> = new Map();
  private batches: Map<string, ClaimBatch> = new Map();

  async createClaim(request: ClaimRequest): Promise<Claim> {
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // In production, verify claimable balance on-chain
    const claimableBalance = await this.getClaimableBalance(
      request.splitId,
      request.recipientAddress
    );

    const claimAmount = request.amount ?? claimableBalance.totalClaimable;
    
    if (claimAmount <= 0) {
      throw new Error('No claimable balance');
    }

    if (claimAmount > claimableBalance.totalClaimable) {
      throw new Error('Insufficient claimable balance');
    }

    const claim: Claim = {
      id: claimId,
      splitId: request.splitId,
      recipientAddress: request.recipientAddress,
      amount: claimAmount,
      currency: claimableBalance.currency,
      status: 'pending',
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    this.claims.set(claimId, claim);
    return claim;
  }

  async getClaim(claimId: string): Promise<Claim | null> {
    return this.claims.get(claimId) || null;
  }

  async getClaimsForRecipient(recipientAddress: string): Promise<Claim[]> {
    return Array.from(this.claims.values())
      .filter(claim => claim.recipientAddress.toLowerCase() === recipientAddress.toLowerCase())
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async getClaimsForSplit(splitId: string): Promise<Claim[]> {
    return Array.from(this.claims.values())
      .filter(claim => claim.splitId === splitId)
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async processClaim(claimId: string): Promise<Claim> {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }

    if (claim.status !== 'pending') {
      throw new Error(`Cannot process claim with status: ${claim.status}`);
    }

    // Update to processing
    claim.status = 'processing';
    this.claims.set(claimId, claim);

    try {
      // In production, execute blockchain transaction
      await this.simulateBlockchainDelay();

      const transactionHash = `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      claim.status = 'confirmed';
      claim.transactionHash = transactionHash;
      claim.blockNumber = Math.floor(Math.random() * 1000000) + 18000000;
      claim.processedAt = new Date();
      
      this.claims.set(claimId, claim);
      return claim;
    } catch (error) {
      claim.status = 'failed';
      this.claims.set(claimId, claim);
      throw error;
    }
  }

  async cancelClaim(claimId: string): Promise<Claim> {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }

    if (claim.status !== 'pending') {
      throw new Error(`Cannot cancel claim with status: ${claim.status}`);
    }

    claim.status = 'cancelled';
    this.claims.set(claimId, claim);
    return claim;
  }

  async createBatchClaim(requests: ClaimRequest[]): Promise<ClaimBatch> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const claims: Claim[] = [];
    let totalAmount = 0;
    let currency = '';

    for (const request of requests) {
      const claim = await this.createClaim(request);
      claims.push(claim);
      totalAmount += claim.amount;
      currency = claim.currency;
    }

    const batch: ClaimBatch = {
      id: batchId,
      claims,
      totalAmount,
      currency,
      status: 'pending',
      createdAt: new Date(),
    };

    this.batches.set(batchId, batch);
    return batch;
  }

  async processBatchClaim(batchId: string): Promise<ClaimBatch> {
    const batch = this.batches.get(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }

    batch.status = 'processing';
    this.batches.set(batchId, batch);

    const results: { claimId: string; success: boolean }[] = [];

    for (const claim of batch.claims) {
      try {
        await this.processClaim(claim.id);
        results.push({ claimId: claim.id, success: true });
      } catch {
        results.push({ claimId: claim.id, success: false });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    if (successCount === batch.claims.length) {
      batch.status = 'completed';
    } else if (successCount > 0) {
      batch.status = 'partial';
    } else {
      batch.status = 'failed';
    }

    batch.completedAt = new Date();
    batch.transactionHash = `0x${Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    this.batches.set(batchId, batch);
    return batch;
  }

  async getClaimableBalance(splitId: string, recipientAddress: string): Promise<ClaimableBalance> {
    // In production, fetch from blockchain/database
    return {
      splitId,
      recipientAddress,
      totalClaimable: 1500.50,
      totalClaimed: 3500.00,
      pendingClaims: 0,
      currency: 'USDC',
      lastClaimAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };
  }

  async getAllClaimableBalances(recipientAddress: string): Promise<ClaimableBalance[]> {
    // In production, fetch all splits user is part of
    return [
      {
        splitId: 'split_1',
        recipientAddress,
        totalClaimable: 1500.50,
        totalClaimed: 3500.00,
        pendingClaims: 0,
        currency: 'USDC',
      },
      {
        splitId: 'split_2',
        recipientAddress,
        totalClaimable: 250.00,
        totalClaimed: 750.00,
        pendingClaims: 1,
        currency: 'USDC',
      },
    ];
  }

  async expireOldClaims(): Promise<number> {
    const now = new Date();
    let expiredCount = 0;

    for (const [id, claim] of this.claims.entries()) {
      if (claim.status === 'pending' && claim.expiresAt && claim.expiresAt < now) {
        claim.status = 'expired';
        this.claims.set(id, claim);
        expiredCount++;
      }
    }

    return expiredCount;
  }

  async getClaimStatistics(splitId: string): Promise<{
    totalClaimed: number;
    totalPending: number;
    claimCount: number;
    averageClaimSize: number;
  }> {
    const claims = await this.getClaimsForSplit(splitId);
    
    const confirmedClaims = claims.filter(c => c.status === 'confirmed');
    const pendingClaims = claims.filter(c => c.status === 'pending');

    return {
      totalClaimed: confirmedClaims.reduce((sum, c) => sum + c.amount, 0),
      totalPending: pendingClaims.reduce((sum, c) => sum + c.amount, 0),
      claimCount: confirmedClaims.length,
      averageClaimSize: confirmedClaims.length > 0 
        ? confirmedClaims.reduce((sum, c) => sum + c.amount, 0) / confirmedClaims.length 
        : 0,
    };
  }

  private async simulateBlockchainDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  }
}

export const claimService = new ClaimService();
export default claimService;

