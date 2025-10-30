"use client";

import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";
import { getSplitContract } from "@/lib/contracts";
import { formatEther } from "ethers";
import { QUERY_BLOCK_LIMIT } from "@/lib/constants";

interface Distribution {
  date: string;
  amount: string;
  timestamp: number;
}

interface RecipientStats {
  address: string;
  totalReceived: string;
  distributionCount: number;
}

interface AnalyticsProps {
  splitAddress: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  walletProvider: any;
}

export default function SplitAnalytics({ splitAddress, walletProvider }: AnalyticsProps) {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [recipientStats, setRecipientStats] = useState<RecipientStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitAddress, walletProvider]);

  const loadAnalytics = async () => {
    if (!walletProvider) return;

    try {
      setLoading(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let providerToUse: any = walletProvider;
      if (typeof window !== 'undefined' && window.ethereum) {
        providerToUse = window.ethereum;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new BrowserProvider(providerToUse as any);
      const split = getSplitContract(splitAddress, provider);

      // Get distribution events
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock + QUERY_BLOCK_LIMIT);
      
      const distributionFilter = split.filters.FundsDistributed();
      const distributionEvents = await split.queryFilter(distributionFilter, fromBlock);

      // Process distributions
      const distributionsData: Distribution[] = [];
      const heatmap: Record<string, number> = {};

      for (const event of distributionEvents) {
        const block = await event.getBlock();
        const date = new Date(block.timestamp * 1000).toISOString().split('T')[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const amount = formatEther((event as any).args[0]);

        distributionsData.push({
          date,
          amount,
          timestamp: block.timestamp,
        });

        // Build heatmap data (date -> amount)
        heatmap[date] = (heatmap[date] || 0) + parseFloat(amount);
      }

      // Get recipient payment events for detailed stats
      const recipientFilter = split.filters.RecipientPaid();
      const recipientEvents = await split.queryFilter(recipientFilter, fromBlock);

      const statsMap: Record<string, { total: number; count: number }> = {};

      for (const event of recipientEvents) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recipient = ((event as any).args[0] as string).toLowerCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const amount = parseFloat(formatEther((event as any).args[1]));

        if (!statsMap[recipient]) {
          statsMap[recipient] = { total: 0, count: 0 };
        }
        statsMap[recipient].total += amount;
        statsMap[recipient].count += 1;
      }

      const stats = Object.entries(statsMap).map(([address, data]) => ({
        address,
        totalReceived: data.total.toFixed(4),
        distributionCount: data.count,
      }));

      setDistributions(distributionsData.reverse());
      setRecipientStats(stats.sort((a, b) => parseFloat(b.totalReceived) - parseFloat(a.totalReceived)));
      setHeatmapData(heatmap);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (amount: number, max: number) => {
    if (amount === 0) return "bg-gray-100";
    const intensity = amount / max;
    if (intensity > 0.75) return "bg-blue-600";
    if (intensity > 0.5) return "bg-blue-500";
    if (intensity > 0.25) return "bg-blue-400";
    return "bg-blue-300";
  };

  const generateLast90Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const maxAmount = Math.max(...Object.values(heatmapData), 1);
  const last90Days = generateLast90Days();

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90">Total Distributions</div>
          <div className="text-3xl font-bold mt-2">{distributions.length}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90">Total Distributed</div>
          <div className="text-3xl font-bold mt-2">
            {distributions.reduce((sum, d) => sum + parseFloat(d.amount), 0).toFixed(4)} ETH
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90">Active Recipients</div>
          <div className="text-3xl font-bold mt-2">{recipientStats.length}</div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Activity Heatmap (Last 90 Days)</h3>
        <div className="overflow-x-auto">
          <div className="inline-grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1 min-w-max">
            {last90Days.map((date) => {
              const amount = heatmapData[date] || 0;
              const colorClass = getHeatmapColor(amount, maxAmount);
              return (
                <div
                  key={date}
                  className={`w-3 h-3 rounded-sm ${colorClass} relative group cursor-pointer transition-transform hover:scale-150`}
                  title={`${date}: ${amount.toFixed(4)} ETH`}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {date}<br />{amount.toFixed(4)} ETH
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
            <span>Less</span>
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">📊 Recent Distributions</h3>
        {distributions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No distributions yet</p>
        ) : (
          <div className="space-y-2">
            {distributions.slice(0, 5).map((dist) => (
              <div key={dist.timestamp} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{dist.amount} ETH distributed</div>
                    <div className="text-xs text-gray-500">{new Date(dist.timestamp * 1000).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

