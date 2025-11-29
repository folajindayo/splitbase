/**
 * RecipientList Component
 * Manage and display split payment recipients
 */

import React, { useState, useCallback } from 'react';

export interface Recipient {
  id: string;
  address: string;
  name?: string;
  ensName?: string;
  percentage: number;
  amount?: number;
  avatar?: string;
  verified?: boolean;
}

export interface RecipientListProps {
  recipients: Recipient[];
  totalAmount: number;
  currency: string;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  maxRecipients?: number;
  editable?: boolean;
  className?: string;
}

export const RecipientList: React.FC<RecipientListProps> = ({
  recipients,
  totalAmount,
  currency,
  onEdit,
  onRemove,
  onAdd,
  maxRecipients = 10,
  editable = true,
  className = '',
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const getShareColor = (percentage: number): string => {
    if (percentage >= 50) return 'from-emerald-400 to-cyan-500';
    if (percentage >= 25) return 'from-blue-400 to-indigo-500';
    if (percentage >= 10) return 'from-purple-400 to-pink-500';
    return 'from-orange-400 to-red-500';
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recipients
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {recipients.length} of {maxRecipients} recipients
            </p>
          </div>
          {editable && recipients.length < maxRecipients && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          )}
        </div>
      </div>

      {/* Recipients List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {recipients.map((recipient, index) => (
          <div
            key={recipient.id}
            className="group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div
              className="px-6 py-4 cursor-pointer"
              onClick={() => toggleExpand(recipient.id)}
            >
              <div className="flex items-center gap-4">
                {/* Avatar/Index */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getShareColor(recipient.percentage)} flex items-center justify-center text-white font-bold shadow-lg`}>
                  {recipient.avatar ? (
                    <img src={recipient.avatar} alt={recipient.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {recipient.name || recipient.ensName || formatAddress(recipient.address)}
                    </p>
                    {recipient.verified && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {recipient.name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">
                      {recipient.ensName || formatAddress(recipient.address)}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {recipient.percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatAmount((totalAmount * recipient.percentage) / 100)} {currency}
                  </p>
                </div>

                {/* Expand Icon */}
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedId === recipient.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getShareColor(recipient.percentage)} transition-all duration-300`}
                  style={{ width: `${recipient.percentage}%` }}
                />
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === recipient.id && (
              <div className="px-6 pb-4 pt-0">
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Full Address</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                      {recipient.address}
                    </p>
                  </div>
                  
                  {recipient.ensName && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ENS Name</p>
                      <p className="text-sm text-gray-900 dark:text-white">{recipient.ensName}</p>
                    </div>
                  )}

                  {editable && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(recipient.id);
                        }}
                        className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(recipient.id);
                        }}
                        className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {recipients.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">No recipients added yet</p>
            {editable && (
              <button
                onClick={onAdd}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Add First Recipient
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(RecipientList);

