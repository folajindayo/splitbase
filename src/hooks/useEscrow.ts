/**
 * useEscrow Hook
 * Manage escrow payment operations
 */

import { useState, useCallback, useMemo } from 'react';

export type EscrowStatus = 
  | 'pending'
  | 'funded'
  | 'releasing'
  | 'released'
  | 'disputed'
  | 'refunded'
  | 'expired';

export interface Escrow {
  id: string;
  creator: string;
  beneficiary: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  releaseCondition: ReleaseCondition;
  createdAt: Date;
  fundedAt?: Date;
  releasesAt?: Date;
  releasedAt?: Date;
  transactionHash?: string;
  contractAddress?: string;
}

export interface ReleaseCondition {
  type: 'time' | 'approval' | 'milestone' | 'multisig';
  params: Record<string, unknown>;
  isMet: boolean;
}

export interface CreateEscrowParams {
  beneficiary: string;
  amount: number;
  currency: string;
  releaseCondition: ReleaseCondition;
}

export interface UseEscrowReturn {
  escrows: Escrow[];
  currentEscrow: Escrow | null;
  status: 'idle' | 'creating' | 'funding' | 'releasing' | 'success' | 'error';
  error: Error | null;
  createEscrow: (params: CreateEscrowParams) => Promise<Escrow | null>;
  fundEscrow: (escrowId: string) => Promise<boolean>;
  releaseEscrow: (escrowId: string) => Promise<boolean>;
  disputeEscrow: (escrowId: string, reason: string) => Promise<boolean>;
  refundEscrow: (escrowId: string) => Promise<boolean>;
  getEscrow: (escrowId: string) => Escrow | null;
  refreshEscrow: (escrowId: string) => Promise<void>;
  reset: () => void;
}

export function useEscrow(): UseEscrowReturn {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [currentEscrow, setCurrentEscrow] = useState<Escrow | null>(null);
  const [status, setStatus] = useState<UseEscrowReturn['status']>('idle');
  const [error, setError] = useState<Error | null>(null);

  const generateId = () => `escrow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createEscrow = useCallback(async (params: CreateEscrowParams): Promise<Escrow | null> => {
    setStatus('creating');
    setError(null);

    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1500));

      const escrow: Escrow = {
        id: generateId(),
        creator: '0x...', // Would come from connected wallet
        beneficiary: params.beneficiary,
        amount: params.amount,
        currency: params.currency,
        status: 'pending',
        releaseCondition: params.releaseCondition,
        createdAt: new Date(),
        contractAddress: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      };

      setEscrows(prev => [...prev, escrow]);
      setCurrentEscrow(escrow);
      setStatus('success');
      return escrow;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create escrow');
      setError(error);
      setStatus('error');
      return null;
    }
  }, []);

  const fundEscrow = useCallback(async (escrowId: string): Promise<boolean> => {
    setStatus('funding');
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setEscrows(prev => prev.map(e => 
        e.id === escrowId 
          ? { 
              ...e, 
              status: 'funded' as EscrowStatus, 
              fundedAt: new Date(),
              transactionHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
            } 
          : e
      ));

      if (currentEscrow?.id === escrowId) {
        setCurrentEscrow(prev => prev ? { ...prev, status: 'funded', fundedAt: new Date() } : null);
      }

      setStatus('success');
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fund escrow');
      setError(error);
      setStatus('error');
      return false;
    }
  }, [currentEscrow]);

  const releaseEscrow = useCallback(async (escrowId: string): Promise<boolean> => {
    setStatus('releasing');
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setEscrows(prev => prev.map(e => 
        e.id === escrowId 
          ? { ...e, status: 'released' as EscrowStatus, releasedAt: new Date() } 
          : e
      ));

      if (currentEscrow?.id === escrowId) {
        setCurrentEscrow(prev => prev ? { ...prev, status: 'released', releasedAt: new Date() } : null);
      }

      setStatus('success');
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to release escrow');
      setError(error);
      setStatus('error');
      return false;
    }
  }, [currentEscrow]);

  const disputeEscrow = useCallback(async (escrowId: string, reason: string): Promise<boolean> => {
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      setEscrows(prev => prev.map(e => 
        e.id === escrowId 
          ? { ...e, status: 'disputed' as EscrowStatus } 
          : e
      ));

      if (currentEscrow?.id === escrowId) {
        setCurrentEscrow(prev => prev ? { ...prev, status: 'disputed' } : null);
      }

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to dispute escrow');
      setError(error);
      return false;
    }
  }, [currentEscrow]);

  const refundEscrow = useCallback(async (escrowId: string): Promise<boolean> => {
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setEscrows(prev => prev.map(e => 
        e.id === escrowId 
          ? { ...e, status: 'refunded' as EscrowStatus } 
          : e
      ));

      if (currentEscrow?.id === escrowId) {
        setCurrentEscrow(prev => prev ? { ...prev, status: 'refunded' } : null);
      }

      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refund escrow');
      setError(error);
      return false;
    }
  }, [currentEscrow]);

  const getEscrow = useCallback((escrowId: string): Escrow | null => {
    return escrows.find(e => e.id === escrowId) || null;
  }, [escrows]);

  const refreshEscrow = useCallback(async (escrowId: string): Promise<void> => {
    // In production, fetch latest state from blockchain
    await new Promise(resolve => setTimeout(resolve, 500));
  }, []);

  const reset = useCallback(() => {
    setCurrentEscrow(null);
    setStatus('idle');
    setError(null);
  }, []);

  return {
    escrows,
    currentEscrow,
    status,
    error,
    createEscrow,
    fundEscrow,
    releaseEscrow,
    disputeEscrow,
    refundEscrow,
    getEscrow,
    refreshEscrow,
    reset,
  };
}

export default useEscrow;

