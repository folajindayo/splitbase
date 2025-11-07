"use client";

import { useState, useEffect } from "react";

interface UserStats {
  totalEscrows: number;
  completedEscrows: number;
  totalVolume: number;
  successRate: number;
  averageCompletionTime: number;
  rating?: number;
}

interface UserProfileCardProps {
  address: string;
  stats?: UserStats;
  showActions?: boolean;
}

export default function UserProfileCard({ 
  address, 
  stats,
  showActions = true 
}: UserProfileCardProps) {
  const [copied, setCopied] = useState(false);
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    // Generate a consistent avatar based on address
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    const index = parseInt(address.slice(2, 4), 16) % colors.length;
    setAvatar(colors[index]);
  }, [address]);

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        {/* Avatar */}
        <div className={`${avatar} w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
          {address.slice(2, 4).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            {shortenAddress(address)}
          </h3>
          <button
            onClick={copyAddress}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2"
          >
            <span className="font-mono">{address}</span>
            {copied ? (
              <span className="text-green-600">✓</span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          {stats?.rating && (
            <div className="flex items-center gap-2 mt-2">
              <div className={`font-semibold ${getRatingColor(stats.rating)}`}>
                {stats.rating.toFixed(1)} ★
              </div>
              <span className="text-sm text-gray-500">
                ({stats.completedEscrows} escrows)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Total Escrows</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalEscrows}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.completedEscrows}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Total Volume</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.totalVolume.toFixed(2)} ETH
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Success Rate</div>
            <div className={`text-xl font-bold ${getSuccessRateColor(stats.successRate)}`}>
              {stats.successRate.toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Additional Info */}
      {stats && (
        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Avg. Completion Time</span>
            <span className="font-medium text-gray-900">
              {stats.averageCompletionTime} days
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Disputes</span>
            <span className="font-medium text-gray-900">
              {Math.max(0, stats.totalEscrows - stats.completedEscrows)}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="mt-6 flex gap-3">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Create Escrow
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            View History
          </button>
        </div>
      )}

      {/* Trust Badge */}
      {stats && stats.successRate >= 95 && stats.completedEscrows >= 10 && (
        <div className="mt-4 flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-lg py-2">
          <span className="text-green-600 text-lg">✓</span>
          <span className="text-sm font-medium text-green-700">Trusted User</span>
        </div>
      )}
    </div>
  );
}

