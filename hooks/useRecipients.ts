/**
 * useRecipients Hook
 */

'use client';

import { useState, useCallback } from 'react';
import { Recipient } from '../lib/types/recipient.types';

export function useRecipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  const addRecipient = useCallback((recipient: Omit<Recipient, 'id'>) => {
    setRecipients((prev) => [
      ...prev,
      { ...recipient, id: Date.now().toString() },
    ]);
  }, []);

  const removeRecipient = useCallback((id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRecipient = useCallback((id: string, updates: Partial<Recipient>) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const clearRecipients = useCallback(() => {
    setRecipients([]);
  }, []);

  const totalShare = recipients.reduce((sum, r) => sum + r.share, 0);

  return {
    recipients,
    addRecipient,
    removeRecipient,
    updateRecipient,
    clearRecipients,
    totalShare,
  };
}

