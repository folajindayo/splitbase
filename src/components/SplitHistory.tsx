/**
 * SplitHistory Component
 * Display history of split payments and distributions
 */

import React, { useState, useMemo, useCallback } from 'react';

export interface SplitHistoryItem {
  id: string;
  type: 'distribution' | 'claim' | 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  recipients?: {
    address: string;
    name?: string;
    share: number;
    amount: number;
  }[];
  transactionHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  initiatedBy?: string;
}

export interface SplitHistoryProps {
  items: SplitHistoryItem[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemClick?: (item: SplitHistoryItem) => void;
  className?: string;
}

export const SplitHistory: React.FC<SplitHistoryProps> = ({
  items,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onItemClick,
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | 'distribution' | 'claim' | 'deposit'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(item => item.type === filter);
  }, [items, filter]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTypeIcon = (type: SplitHistoryItem['type']) => {
    switch (type) {
      case 'distribution':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'claim':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'deposit':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'withdrawal':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        );
    }
  };

  const getTypeColor = (type: SplitHistoryItem['type']) => {
    switch (type) {
      case 'distribution': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'claim': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'deposit': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'withdrawal': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    }
  };

  const getStatusBadge = (status: SplitHistoryItem['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Confirmed</span>;
      case 'pending':
        return <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Pending</span>;
      case 'failed':
        return <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Failed</span>;
    }
  };

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</h3>
          <div className="flex gap-2">
            {(['all', 'distribution', 'claim', 'deposit'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors capitalize ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {filteredItems.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id}>
              <div
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={() => onItemClick ? onItemClick(item) : handleToggleExpand(item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {item.type}
                      </p>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(item.timestamp)} • {formatAddress(item.transactionHash)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      item.type === 'deposit' ? 'text-green-600 dark:text-green-400' :
                      item.type === 'withdrawal' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-900 dark:text-white'
                    }`}>
                      {item.type === 'deposit' ? '+' : item.type === 'withdrawal' ? '-' : ''}
                      {formatAmount(item.amount)} {item.currency}
                    </p>
                  </div>
                  {item.recipients && item.recipients.length > 0 && (
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Expanded Recipients */}
              {expandedId === item.id && item.recipients && item.recipients.length > 0 && (
                <div className="px-6 pb-4 bg-gray-50 dark:bg-slate-800/50">
                  <div className="space-y-2">
                    {item.recipients.map((recipient, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs">
                            {recipient.name?.slice(0, 1) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {recipient.name || formatAddress(recipient.address)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {recipient.share}% share
                            </p>
                          </div>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatAmount(recipient.amount)} {item.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full py-2 text-blue-500 hover:text-blue-600 font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(SplitHistory);

