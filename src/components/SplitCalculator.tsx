/**
 * SplitCalculator Component
 * Interactive calculator for payment splits
 */

import React, { useState, useCallback, useMemo } from 'react';

export interface Recipient {
  id: string;
  address: string;
  name?: string;
  percentage: number;
  amount?: number;
}

export interface SplitCalculatorProps {
  totalAmount: number;
  currency: string;
  recipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
  minRecipients?: number;
  maxRecipients?: number;
  className?: string;
}

export const SplitCalculator: React.FC<SplitCalculatorProps> = ({
  totalAmount,
  currency,
  recipients,
  onRecipientsChange,
  minRecipients = 2,
  maxRecipients = 10,
  className = '',
}) => {
  const [equalSplit, setEqualSplit] = useState(true);

  const totalPercentage = useMemo(() => {
    return recipients.reduce((sum, r) => sum + r.percentage, 0);
  }, [recipients]);

  const isValid = useMemo(() => {
    return Math.abs(totalPercentage - 100) < 0.01;
  }, [totalPercentage]);

  const generateId = () => `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addRecipient = useCallback(() => {
    if (recipients.length >= maxRecipients) return;

    const newPercentage = equalSplit ? 100 / (recipients.length + 1) : 0;
    const newRecipients = equalSplit
      ? recipients.map(r => ({ ...r, percentage: newPercentage }))
      : [...recipients];

    newRecipients.push({
      id: generateId(),
      address: '',
      percentage: newPercentage,
    });

    onRecipientsChange(newRecipients);
  }, [recipients, maxRecipients, equalSplit, onRecipientsChange]);

  const removeRecipient = useCallback((id: string) => {
    if (recipients.length <= minRecipients) return;

    let newRecipients = recipients.filter(r => r.id !== id);

    if (equalSplit) {
      const newPercentage = 100 / newRecipients.length;
      newRecipients = newRecipients.map(r => ({ ...r, percentage: newPercentage }));
    }

    onRecipientsChange(newRecipients);
  }, [recipients, minRecipients, equalSplit, onRecipientsChange]);

  const updateRecipient = useCallback((id: string, updates: Partial<Recipient>) => {
    const newRecipients = recipients.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    onRecipientsChange(newRecipients);
  }, [recipients, onRecipientsChange]);

  const handleEqualSplitToggle = useCallback(() => {
    const newEqualSplit = !equalSplit;
    setEqualSplit(newEqualSplit);

    if (newEqualSplit) {
      const percentage = 100 / recipients.length;
      const newRecipients = recipients.map(r => ({ ...r, percentage }));
      onRecipientsChange(newRecipients);
    }
  }, [equalSplit, recipients, onRecipientsChange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Split Payment</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total: {formatCurrency(totalAmount)} {currency}
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-gray-600 dark:text-gray-400">Equal split</span>
          <div
            onClick={handleEqualSplitToggle}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              equalSplit ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                equalSplit ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </div>
        </label>
      </div>

      {/* Recipients List */}
      <div className="space-y-4 mb-6">
        {recipients.map((recipient, index) => (
          <div
            key={recipient.id}
            className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                {index + 1}
              </div>
              <input
                type="text"
                value={recipient.name || ''}
                onChange={(e) => updateRecipient(recipient.id, { name: e.target.value })}
                placeholder="Recipient name (optional)"
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm"
              />
              {recipients.length > minRecipients && (
                <button
                  onClick={() => removeRecipient(recipient.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <input
              type="text"
              value={recipient.address}
              onChange={(e) => updateRecipient(recipient.id, { address: e.target.value })}
              placeholder="0x... or ENS name"
              className="w-full bg-white dark:bg-slate-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm font-mono mb-3"
            />

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={recipient.percentage}
                  onChange={(e) => updateRecipient(recipient.id, { percentage: parseFloat(e.target.value) })}
                  disabled={equalSplit}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div className="w-24 flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={recipient.percentage.toFixed(1)}
                  onChange={(e) => updateRecipient(recipient.id, { percentage: parseFloat(e.target.value) || 0 })}
                  disabled={equalSplit}
                  className="w-16 bg-white dark:bg-slate-700 rounded px-2 py-1 text-sm text-gray-900 dark:text-white text-center outline-none"
                />
                <span className="text-gray-500 dark:text-gray-400">%</span>
              </div>
            </div>

            <div className="mt-2 text-right">
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency((totalAmount * recipient.percentage) / 100)} {currency}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Recipient Button */}
      {recipients.length < maxRecipients && (
        <button
          onClick={addRecipient}
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-emerald-500 hover:text-emerald-500 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Recipient
        </button>
      )}

      {/* Summary */}
      <div className={`mt-6 p-4 rounded-xl ${isValid ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
        <div className="flex justify-between items-center">
          <span className={`text-sm font-medium ${isValid ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            Total Allocation
          </span>
          <span className={`text-lg font-bold ${isValid ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            {totalPercentage.toFixed(1)}%
          </span>
        </div>
        {!isValid && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Total must equal 100%
          </p>
        )}
      </div>
    </div>
  );
};

export default React.memo(SplitCalculator);

