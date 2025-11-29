/**
 * PaymentStream Component
 * Display streaming payment progress
 */

import React, { useState, useEffect, useMemo } from 'react';

export interface PaymentStreamProps {
  totalAmount: number;
  streamedAmount: number;
  claimedAmount: number;
  currency: string;
  startTime: Date;
  endTime: Date;
  recipientName?: string;
  onClaim?: () => void;
  isClaimable?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const PaymentStream: React.FC<PaymentStreamProps> = ({
  totalAmount,
  streamedAmount,
  claimedAmount,
  currency,
  startTime,
  endTime,
  recipientName,
  onClaim,
  isClaimable = false,
  isLoading = false,
  className = '',
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const streamProgress = useMemo(() => {
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = currentTime.getTime() - startTime.getTime();
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }, [startTime, endTime, currentTime]);

  const claimProgress = useMemo(() => {
    if (totalAmount === 0) return 0;
    return (claimedAmount / totalAmount) * 100;
  }, [claimedAmount, totalAmount]);

  const claimableAmount = useMemo(() => {
    return Math.max(0, streamedAmount - claimedAmount);
  }, [streamedAmount, claimedAmount]);

  const remainingAmount = useMemo(() => {
    return totalAmount - streamedAmount;
  }, [totalAmount, streamedAmount]);

  const timeRemaining = useMemo(() => {
    const diff = endTime.getTime() - currentTime.getTime();
    if (diff <= 0) return 'Stream ended';

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((diff % (60 * 1000)) / 1000);

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    if (minutes > 0) return `${minutes}m ${seconds}s remaining`;
    return `${seconds}s remaining`;
  }, [endTime, currentTime]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isEnded = currentTime >= endTime;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Payment Stream</h3>
            {recipientName && (
              <p className="text-cyan-100 text-sm">To: {recipientName}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {formatAmount(totalAmount)} {currency}
            </p>
            <p className="text-cyan-100 text-sm">{timeRemaining}</p>
          </div>
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="p-6">
        {/* Stream Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500 dark:text-gray-400">Stream Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {streamProgress.toFixed(1)}%
            </span>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
            {/* Claimed portion */}
            <div
              className="absolute inset-y-0 left-0 bg-green-500 transition-all duration-300"
              style={{ width: `${claimProgress}%` }}
            />
            {/* Claimable portion */}
            <div
              className="absolute inset-y-0 bg-cyan-500 animate-pulse transition-all duration-300"
              style={{
                left: `${claimProgress}%`,
                width: `${(streamProgress - claimProgress)}%`,
              }}
            />
            {/* Remaining */}
            <div
              className="absolute inset-y-0 right-0 bg-gray-300 dark:bg-gray-600"
              style={{ width: `${100 - streamProgress}%` }}
            />
          </div>
          
          {/* Legend */}
          <div className="flex gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Claimed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-cyan-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Claimable</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Remaining</span>
            </div>
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
            <p className="text-sm text-green-600 dark:text-green-400 mb-1">Claimed</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              {formatAmount(claimedAmount)}
            </p>
          </div>
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-4 text-center">
            <p className="text-sm text-cyan-600 dark:text-cyan-400 mb-1">Claimable</p>
            <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300">
              {formatAmount(claimableAmount)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Remaining</p>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
              {formatAmount(remainingAmount)}
            </p>
          </div>
        </div>

        {/* Time Info */}
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
          <div>
            <p className="text-xs">Started</p>
            <p>{formatDate(startTime)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs">Ends</p>
            <p>{formatDate(endTime)}</p>
          </div>
        </div>

        {/* Claim Button */}
        {onClaim && (
          <button
            onClick={onClaim}
            disabled={!isClaimable || claimableAmount <= 0 || isLoading}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              isClaimable && claimableAmount > 0 && !isLoading
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Claiming...
              </span>
            ) : claimableAmount <= 0 ? (
              isEnded ? 'Stream Completed' : 'Nothing to Claim'
            ) : (
              `Claim ${formatAmount(claimableAmount)} ${currency}`
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(PaymentStream);

