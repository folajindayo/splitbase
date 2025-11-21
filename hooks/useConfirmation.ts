/**
 * useConfirmation Hook
 */

'use client';

import { useState } from 'react';

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);

  const confirm = (callback: () => void) => {
    setConfirmCallback(() => callback);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (confirmCallback) {
      confirmCallback();
    }
    setIsOpen(false);
    setConfirmCallback(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setConfirmCallback(null);
  };

  return {
    isOpen,
    confirm,
    handleConfirm,
    handleCancel,
  };
}

