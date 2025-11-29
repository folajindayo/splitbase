/**
 * useSplit Hook
 * Unified hook for split payment operations
 */

import { useState, useCallback, useMemo } from 'react';

export interface Recipient {
  id: string;
  address: string;
  name?: string;
  percentage: number;
}

export interface SplitConfig {
  totalAmount: number;
  currency: string;
  recipients: Recipient[];
  releaseType: 'immediate' | 'scheduled' | 'milestone';
  scheduledDate?: Date;
}

export interface SplitResult {
  id: string;
  transactionHash: string;
  recipients: Array<{
    address: string;
    amount: number;
    status: 'pending' | 'sent' | 'claimed';
  }>;
  createdAt: Date;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

export type SplitStatus = 
  | 'idle'
  | 'validating'
  | 'pending_approval'
  | 'processing'
  | 'success'
  | 'failed';

export interface UseSplitReturn {
  config: SplitConfig | null;
  status: SplitStatus;
  result: SplitResult | null;
  error: Error | null;
  isValid: boolean;
  validationErrors: string[];
  setConfig: (config: SplitConfig) => void;
  addRecipient: (recipient: Omit<Recipient, 'id'>) => void;
  removeRecipient: (id: string) => void;
  updateRecipient: (id: string, updates: Partial<Recipient>) => void;
  distributeEqually: () => void;
  createSplit: () => Promise<SplitResult | null>;
  reset: () => void;
}

export function useSplit(): UseSplitReturn {
  const [config, setConfigState] = useState<SplitConfig | null>(null);
  const [status, setStatus] = useState<SplitStatus>('idle');
  const [result, setResult] = useState<SplitResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const generateId = () => `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const validationErrors = useMemo(() => {
    if (!config) return ['Configuration required'];
    
    const errors: string[] = [];
    
    if (config.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }
    
    if (config.recipients.length < 2) {
      errors.push('At least 2 recipients required');
    }
    
    const totalPercentage = config.recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      errors.push(`Total percentage must equal 100% (currently ${totalPercentage.toFixed(1)}%)`);
    }
    
    const invalidAddresses = config.recipients.filter(
      r => !r.address || !/^0x[a-fA-F0-9]{40}$/.test(r.address)
    );
    if (invalidAddresses.length > 0) {
      errors.push('All recipients must have valid addresses');
    }
    
    const duplicateAddresses = config.recipients.filter(
      (r, i, arr) => arr.findIndex(x => x.address.toLowerCase() === r.address.toLowerCase()) !== i
    );
    if (duplicateAddresses.length > 0) {
      errors.push('Duplicate recipient addresses not allowed');
    }
    
    return errors;
  }, [config]);

  const isValid = validationErrors.length === 0;

  const setConfig = useCallback((newConfig: SplitConfig) => {
    setConfigState(newConfig);
    setError(null);
  }, []);

  const addRecipient = useCallback((recipient: Omit<Recipient, 'id'>) => {
    setConfigState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        recipients: [...prev.recipients, { ...recipient, id: generateId() }],
      };
    });
  }, []);

  const removeRecipient = useCallback((id: string) => {
    setConfigState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        recipients: prev.recipients.filter(r => r.id !== id),
      };
    });
  }, []);

  const updateRecipient = useCallback((id: string, updates: Partial<Recipient>) => {
    setConfigState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        recipients: prev.recipients.map(r => 
          r.id === id ? { ...r, ...updates } : r
        ),
      };
    });
  }, []);

  const distributeEqually = useCallback(() => {
    setConfigState(prev => {
      if (!prev || prev.recipients.length === 0) return prev;
      const equalShare = 100 / prev.recipients.length;
      return {
        ...prev,
        recipients: prev.recipients.map(r => ({ ...r, percentage: equalShare })),
      };
    });
  }, []);

  const createSplit = useCallback(async (): Promise<SplitResult | null> => {
    if (!config || !isValid) {
      setError(new Error('Invalid configuration'));
      return null;
    }

    try {
      setStatus('validating');
      setError(null);

      // Validate
      await new Promise(resolve => setTimeout(resolve, 500));

      setStatus('pending_approval');

      // Simulate wallet approval
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatus('processing');

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      const splitResult: SplitResult = {
        id: `split_${Date.now()}`,
        transactionHash: `0x${Array.from({ length: 64 }, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join('')}`,
        recipients: config.recipients.map(r => ({
          address: r.address,
          amount: (config.totalAmount * r.percentage) / 100,
          status: config.releaseType === 'immediate' ? 'sent' : 'pending',
        })),
        createdAt: new Date(),
        status: config.releaseType === 'immediate' ? 'completed' : 'active',
      };

      setResult(splitResult);
      setStatus('success');
      return splitResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Split creation failed');
      setError(error);
      setStatus('failed');
      return null;
    }
  }, [config, isValid]);

  const reset = useCallback(() => {
    setConfigState(null);
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    config,
    status,
    result,
    error,
    isValid,
    validationErrors,
    setConfig,
    addRecipient,
    removeRecipient,
    updateRecipient,
    distributeEqually,
    createSplit,
    reset,
  };
}

export default useSplit;

