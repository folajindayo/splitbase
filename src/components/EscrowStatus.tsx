/**
 * EscrowStatus Component
 * Display escrow payment status
 */

import React from 'react';

export type EscrowState = 
  | 'pending'
  | 'funded'
  | 'releasing'
  | 'released'
  | 'disputed'
  | 'refunded'
  | 'expired';

export interface EscrowStatusProps {
  state: EscrowState;
  amount: number;
  currency: string;
  fundedAt?: Date;
  releasesAt?: Date;
  releasedAmount?: number;
  disputeReason?: string;
  showTimeline?: boolean;
  className?: string;
}

export const EscrowStatus: React.FC<EscrowStatusProps> = ({
  state,
  amount,
  currency,
  fundedAt,
  releasesAt,
  releasedAmount = 0,
  disputeReason,
  showTimeline = false,
  className = '',
}) => {
  const getStateConfig = () => {
    const configs: Record<EscrowState, {
      label: string;
      color: string;
      bgColor: string;
      icon: React.ReactNode;
      description: string;
    }> = {
      pending: {
        label: 'Pending Deposit',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        description: 'Waiting for funds to be deposited',
      },
      funded: {
        label: 'Funded',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        description: 'Funds secured in escrow',
      },
      releasing: {
        label: 'Releasing',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        icon: (
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        description: 'Funds are being released',
      },
      released: {
        label: 'Released',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        description: 'All funds have been released',
      },
      disputed: {
        label: 'Disputed',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        description: 'A dispute has been raised',
      },
      refunded: {
        label: 'Refunded',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-900/20',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        ),
        description: 'Funds have been refunded',
      },
      expired: {
        label: 'Expired',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-900/20',
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        description: 'Escrow has expired',
      },
    };
    return configs[state];
  };

  const config = getStateConfig();
  const progress = (releasedAmount / amount) * 100;

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`px-6 py-4 ${config.bgColor}`}>
        <div className="flex items-center gap-3">
          <div className={config.color}>{config.icon}</div>
          <div>
            <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Amount Display */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Escrow Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatAmount(amount)} {currency}
              </p>
            </div>
            {releasedAmount > 0 && releasedAmount < amount && (
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Released</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatAmount(releasedAmount)} {currency}
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {(state === 'funded' || state === 'releasing' || state === 'released') && (
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  state === 'released' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-3 text-sm">
          {fundedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Funded</span>
              <span className="text-gray-900 dark:text-white">{formatDate(fundedAt)}</span>
            </div>
          )}
          {releasesAt && state !== 'released' && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Release Date</span>
              <span className="text-gray-900 dark:text-white">{formatDate(releasesAt)}</span>
            </div>
          )}
        </div>

        {/* Dispute Info */}
        {state === 'disputed' && disputeReason && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">
              <strong>Dispute Reason:</strong> {disputeReason}
            </p>
          </div>
        )}

        {/* Timeline */}
        {showTimeline && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Timeline</h4>
            <div className="space-y-4">
              {['Created', 'Funded', 'Released'].map((step, index) => {
                const isCompleted = index <= ['pending', 'funded', 'released'].indexOf(state);
                const isCurrent = step.toLowerCase() === state || 
                  (state === 'releasing' && step === 'Released');
                
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      isCompleted ? 'bg-green-500' : 
                      isCurrent ? 'bg-blue-500 animate-pulse' : 
                      'bg-gray-300 dark:bg-gray-600'
                    }`} />
                    <span className={`text-sm ${
                      isCompleted ? 'text-gray-900 dark:text-white' : 
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(EscrowStatus);

