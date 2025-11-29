/**
 * useRecipients Hook
 * Manage recipient list with validation
 */

import { useState, useCallback, useMemo } from 'react';

export interface Recipient {
  id: string;
  address: string;
  name?: string;
  ensName?: string;
  percentage: number;
  isValid: boolean;
  error?: string;
}

export interface UseRecipientsOptions {
  minRecipients?: number;
  maxRecipients?: number;
  initialRecipients?: Recipient[];
}

export interface UseRecipientsReturn {
  recipients: Recipient[];
  addRecipient: (recipient?: Partial<Recipient>) => void;
  removeRecipient: (id: string) => void;
  updateRecipient: (id: string, updates: Partial<Recipient>) => void;
  setRecipients: (recipients: Recipient[]) => void;
  distributeEqually: () => void;
  validateAll: () => boolean;
  totalPercentage: number;
  isValid: boolean;
  validationErrors: string[];
  canAdd: boolean;
  canRemove: boolean;
}

const DEFAULT_MIN_RECIPIENTS = 2;
const DEFAULT_MAX_RECIPIENTS = 100;

export function useRecipients(options: UseRecipientsOptions = {}): UseRecipientsReturn {
  const {
    minRecipients = DEFAULT_MIN_RECIPIENTS,
    maxRecipients = DEFAULT_MAX_RECIPIENTS,
    initialRecipients = [],
  } = options;

  const [recipients, setRecipientsState] = useState<Recipient[]>(initialRecipients);

  const generateId = () => `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const validateAddress = useCallback((address: string): { isValid: boolean; error?: string } => {
    if (!address) {
      return { isValid: false, error: 'Address is required' };
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return { isValid: false, error: 'Invalid address format' };
    }
    return { isValid: true };
  }, []);

  const validateRecipient = useCallback((recipient: Recipient, allRecipients: Recipient[]): Recipient => {
    const addressValidation = validateAddress(recipient.address);
    
    // Check for duplicates
    const isDuplicate = allRecipients.some(
      r => r.id !== recipient.id && 
           r.address.toLowerCase() === recipient.address.toLowerCase() &&
           r.address !== ''
    );

    let error = addressValidation.error;
    if (!error && isDuplicate) {
      error = 'Duplicate address';
    }
    if (!error && recipient.percentage < 0) {
      error = 'Percentage cannot be negative';
    }
    if (!error && recipient.percentage > 100) {
      error = 'Percentage cannot exceed 100%';
    }

    return {
      ...recipient,
      isValid: !error,
      error,
    };
  }, [validateAddress]);

  const addRecipient = useCallback((partial?: Partial<Recipient>) => {
    if (recipients.length >= maxRecipients) return;

    const newRecipient: Recipient = {
      id: generateId(),
      address: '',
      percentage: 0,
      isValid: false,
      ...partial,
    };

    setRecipientsState(prev => {
      const updated = [...prev, newRecipient];
      return updated.map(r => validateRecipient(r, updated));
    });
  }, [recipients.length, maxRecipients, validateRecipient]);

  const removeRecipient = useCallback((id: string) => {
    if (recipients.length <= minRecipients) return;

    setRecipientsState(prev => {
      const updated = prev.filter(r => r.id !== id);
      return updated.map(r => validateRecipient(r, updated));
    });
  }, [recipients.length, minRecipients, validateRecipient]);

  const updateRecipient = useCallback((id: string, updates: Partial<Recipient>) => {
    setRecipientsState(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      return updated.map(r => validateRecipient(r, updated));
    });
  }, [validateRecipient]);

  const setRecipients = useCallback((newRecipients: Recipient[]) => {
    const validated = newRecipients.map(r => validateRecipient(r, newRecipients));
    setRecipientsState(validated);
  }, [validateRecipient]);

  const distributeEqually = useCallback(() => {
    if (recipients.length === 0) return;

    const equalPercentage = Math.floor((100 / recipients.length) * 100) / 100;
    const remainder = 100 - equalPercentage * recipients.length;

    setRecipientsState(prev => {
      const updated = prev.map((r, i) => ({
        ...r,
        percentage: equalPercentage + (i === 0 ? remainder : 0),
      }));
      return updated.map(r => validateRecipient(r, updated));
    });
  }, [recipients.length, validateRecipient]);

  const validateAll = useCallback((): boolean => {
    setRecipientsState(prev => prev.map(r => validateRecipient(r, prev)));
    return recipients.every(r => r.isValid);
  }, [recipients, validateRecipient]);

  const totalPercentage = useMemo(() => {
    return recipients.reduce((sum, r) => sum + r.percentage, 0);
  }, [recipients]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    if (recipients.length < minRecipients) {
      errors.push(`At least ${minRecipients} recipients required`);
    }
    
    if (Math.abs(totalPercentage - 100) > 0.01 && recipients.length >= minRecipients) {
      errors.push(`Total percentage must equal 100% (currently ${totalPercentage.toFixed(1)}%)`);
    }
    
    const invalidRecipients = recipients.filter(r => !r.isValid);
    if (invalidRecipients.length > 0) {
      errors.push(`${invalidRecipients.length} recipient(s) have invalid data`);
    }

    return errors;
  }, [recipients, totalPercentage, minRecipients]);

  const isValid = validationErrors.length === 0 && recipients.every(r => r.isValid);
  const canAdd = recipients.length < maxRecipients;
  const canRemove = recipients.length > minRecipients;

  return {
    recipients,
    addRecipient,
    removeRecipient,
    updateRecipient,
    setRecipients,
    distributeEqually,
    validateAll,
    totalPercentage,
    isValid,
    validationErrors,
    canAdd,
    canRemove,
  };
}

export default useRecipients;
