/**
 * useClaim Hook
 * Handle payment claim operations
 */

import { useState, useCallback, useEffect } from 'react';

export type ClaimStatus = 
  | 'idle'
  | 'checking'
  | 'claimable'
  | 'claiming'
  | 'confirming'
  | 'claimed'
  | 'failed';

export interface ClaimableAmount {
  splitId: string;
  splitName: string;
  amount: number;
  currency: string;
  streamedAmount: number;
  unclaimedAmount: number;
  vestingProgress?: number;
}

export interface ClaimTransaction {
  id: string;
  splitId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  timestamp: Date;
}

export interface UseClaimOptions {
  address: string | undefined;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseClaimReturn {
  claimableAmounts: ClaimableAmount[];
  totalClaimable: number;
  status: ClaimStatus;
  error: Error | null;
  isLoading: boolean;
  claim: (splitId: string, amount?: number) => Promise<ClaimTransaction | null>;
  claimAll: () => Promise<ClaimTransaction[]>;
  refreshClaimable: () => Promise<void>;
  recentClaims: ClaimTransaction[];
}

export function useClaim(options: UseClaimOptions): UseClaimReturn {
  const { address, autoRefresh = true, refreshInterval = 30000 } = options;

  const [claimableAmounts, setClaimableAmounts] = useState<ClaimableAmount[]>([]);
  const [recentClaims, setRecentClaims] = useState<ClaimTransaction[]>([]);
  const [status, setStatus] = useState<ClaimStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const totalClaimable = claimableAmounts.reduce((sum, c) => sum + c.unclaimedAmount, 0);

  const fetchClaimable = useCallback(async () => {
    if (!address) {
      setClaimableAmounts([]);
      return;
    }

    setStatus('checking');
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock claimable amounts
      const mockClaimable: ClaimableAmount[] = [
        {
          splitId: 'split_1',
          splitName: 'Project Revenue Share',
          amount: 5000,
          currency: 'USDC',
          streamedAmount: 3500,
          unclaimedAmount: 1250.50,
          vestingProgress: 70,
        },
        {
          splitId: 'split_2',
          splitName: 'Creator Royalties',
          amount: 1000,
          currency: 'USDC',
          streamedAmount: 1000,
          unclaimedAmount: 425.00,
        },
      ];

      setClaimableAmounts(mockClaimable);
      setStatus(mockClaimable.some(c => c.unclaimedAmount > 0) ? 'claimable' : 'idle');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch claimable amounts'));
      setStatus('failed');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const claim = useCallback(async (
    splitId: string,
    amount?: number
  ): Promise<ClaimTransaction | null> => {
    if (!address) {
      setError(new Error('Wallet not connected'));
      return null;
    }

    const claimable = claimableAmounts.find(c => c.splitId === splitId);
    if (!claimable) {
      setError(new Error('Split not found'));
      return null;
    }

    const claimAmount = amount ?? claimable.unclaimedAmount;
    if (claimAmount <= 0 || claimAmount > claimable.unclaimedAmount) {
      setError(new Error('Invalid claim amount'));
      return null;
    }

    setStatus('claiming');
    setError(null);

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      const transaction: ClaimTransaction = {
        id: `claim_${Date.now()}`,
        splitId,
        amount: claimAmount,
        currency: claimable.currency,
        status: 'confirmed',
        transactionHash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`,
        timestamp: new Date(),
      };

      // Update claimable amounts
      setClaimableAmounts(prev => prev.map(c => 
        c.splitId === splitId
          ? { ...c, unclaimedAmount: c.unclaimedAmount - claimAmount }
          : c
      ));

      setRecentClaims(prev => [transaction, ...prev.slice(0, 9)]);
      setStatus('claimed');

      return transaction;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Claim failed');
      setError(error);
      setStatus('failed');
      return null;
    }
  }, [address, claimableAmounts]);

  const claimAll = useCallback(async (): Promise<ClaimTransaction[]> => {
    if (!address) {
      setError(new Error('Wallet not connected'));
      return [];
    }

    const claimableWithBalance = claimableAmounts.filter(c => c.unclaimedAmount > 0);
    if (claimableWithBalance.length === 0) {
      return [];
    }

    setStatus('claiming');
    setError(null);

    const transactions: ClaimTransaction[] = [];

    try {
      // Simulate batch claim
      await new Promise(resolve => setTimeout(resolve, 3000));

      for (const claimable of claimableWithBalance) {
        const transaction: ClaimTransaction = {
          id: `claim_${Date.now()}_${claimable.splitId}`,
          splitId: claimable.splitId,
          amount: claimable.unclaimedAmount,
          currency: claimable.currency,
          status: 'confirmed',
          transactionHash: `0x${Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
          ).join('')}`,
          timestamp: new Date(),
        };
        transactions.push(transaction);
      }

      // Update all claimable amounts to 0
      setClaimableAmounts(prev => prev.map(c => ({ ...c, unclaimedAmount: 0 })));
      setRecentClaims(prev => [...transactions, ...prev.slice(0, 10 - transactions.length)]);
      setStatus('claimed');

      return transactions;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Batch claim failed');
      setError(error);
      setStatus('failed');
      return [];
    }
  }, [address, claimableAmounts]);

  const refreshClaimable = useCallback(async () => {
    await fetchClaimable();
  }, [fetchClaimable]);

  // Initial fetch
  useEffect(() => {
    fetchClaimable();
  }, [fetchClaimable]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !address) return;

    const interval = setInterval(fetchClaimable, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, address, refreshInterval, fetchClaimable]);

  return {
    claimableAmounts,
    totalClaimable,
    status,
    error,
    isLoading,
    claim,
    claimAll,
    refreshClaimable,
    recentClaims,
  };
}

export default useClaim;

