/**
 * useSplitForm Hook
 */

import { useState } from 'react';
import { Recipient } from '../utils/split-calculator';

export function useSplitForm() {
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

  return {
    recipients,
    addRecipient,
    removeRecipient,
    updateRecipient,
  };
}

