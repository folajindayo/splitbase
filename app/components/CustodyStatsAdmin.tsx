"use client";

import { useState, useEffect } from "react";

interface CustodyStats {
  totalEscrows: number;
  totalValueInCustody: string;
  currency: string;
  byStatus: Record<string, number>;
  byCurrency: Record<string, number>;
  metrics: {
    fundedEscrows: number;
    releasedEscrows: number;
    completionRate: string;
    averageEscrowValue: string;
    recentEscrows: number;
  };
  auditStats: {
    totalOperations: number;
    walletCreations: number;
    balanceChecks: number;
    fundsReleased: number;
    fundsRefunded: number;
    milestonesReleased: number;
    autoFunded: number;
    totalAmountReleased: number;
    totalAmountRefunded: number;
  } | null;
  timestamp: string;
}

export default function CustodyStatsAdmin() {
  const [stats, setStats] = useState<CustodyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/escrow/custody-stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-600">Loading custody statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="text-red-800 font-medium">Error loading statistics</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Custody Statistics</h2>
            <p className="text-purple-100">Platform-wide custody monitoring</p>
          </div>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-medium text-sm"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="text-sm font-medium text-gray-600">Total in Custody</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalValueInCustody}</div>
          <div className="text-sm text-gray-500 mt-1">{stats.currency}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-sm font-medium text-gray-600">Total Escrows</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalEscrows}</div>
          <div className="text-sm text-gray-500 mt-1">
            {stats.metrics.recentEscrows} in last 30 days
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-sm font-medium text-gray-600">Completion Rate</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.metrics.completionRate}</div>
          <div className="text-sm text-gray-500 mt-1">
            {stats.metrics.releasedEscrows} released
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Escrows by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600 capitalize mt-1">{status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Statistics */}
      {stats.auditStats && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Audit Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">Operations</div>
              <div className="text-2xl font-bold text-blue-900">
                {stats.auditStats.totalOperations}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium mb-1">Wallets Created</div>
              <div className="text-2xl font-bold text-green-900">
                {stats.auditStats.walletCreations}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium mb-1">Funds Released</div>
              <div className="text-2xl font-bold text-purple-900">
                {stats.auditStats.fundsReleased}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-medium mb-1">Auto-Funded</div>
              <div className="text-2xl font-bold text-orange-900">
                {stats.auditStats.autoFunded}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium mb-1">Total Released</div>
              <div className="text-xl font-bold text-green-900">
                {stats.auditStats.totalAmountReleased.toFixed(6)} ETH
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-sm text-yellow-600 font-medium mb-1">Total Refunded</div>
              <div className="text-xl font-bold text-yellow-900">
                {stats.auditStats.totalAmountRefunded.toFixed(6)} ETH
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Additional Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Average Escrow Value</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.metrics.averageEscrowValue} {stats.currency}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Funded Escrows</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.metrics.fundedEscrows}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Last Updated</div>
            <div className="text-sm text-gray-700">
              {new Date(stats.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

