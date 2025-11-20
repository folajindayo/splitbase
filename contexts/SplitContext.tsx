/**
 * Split Context
 */

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Recipient } from '../lib/utils/split-calculator';

interface SplitContextType {
  recipients: Recipient[];
  setRecipients: (recipients: Recipient[]) => void;
  addRecipient: () => void;
  removeRecipient: (index: number) => void;
  updateRecipient: (index: number, field: keyof Recipient, value: any) => void;
}

const SplitContext = createContext<SplitContextType | undefined>(undefined);

export function SplitProvider({ children }: { children: ReactNode }) {
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: '', percentage: 100 },
  ]);

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', percentage: 0 }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: any) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const value = {
    recipients,
    setRecipients,
    addRecipient,
    removeRecipient,
    updateRecipient,
  };

  return <SplitContext.Provider value={value}>{children}</SplitContext.Provider>;
}

export function useSplitContext() {
  const context = useContext(SplitContext);
  if (!context) {
    throw new Error('useSplitContext must be used within SplitProvider');
  }
  return context;
}

