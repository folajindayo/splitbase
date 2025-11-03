"use client";

import { SplitWithRecipients } from "@/lib/splits";

interface SplitStatsProps {
  splits: SplitWithRecipients[];
}

export default function SplitStats({ splits }: SplitStatsProps) {
  // Calculate statistics
  const totalSplits = splits.length;
  const totalRecipients = splits.reduce((sum, split) => sum + split.recipients.length, 0);
  const avgRecipientsPerSplit = totalSplits > 0 ? (totalRecipients / totalSplits).toFixed(1) : "0";
  const favoriteSplits = splits.filter(s => s.is_favorite).length;

  // Top recipient percentages
  const allRecipients = splits.flatMap(s => s.recipients);
  const avgPercentage = allRecipients.length > 0 
    ? (allRecipients.reduce((sum, r) => sum + r.percentage, 0) / allRecipients.length).toFixed(1)
    : "0";

  // Distribution chart data
  const recipientDistribution = [
    { count: 2, splits: splits.filter(s => s.recipients.length === 2).length },
    { count: 3, splits: splits.filter(s => s.recipients.length === 3).length },
    { count: 4, splits: splits.filter(s => s.recipients.length === 4).length },
    { count: "5+", splits: splits.filter(s => s.recipients.length >= 5).length },
  ];

  const maxSplits = Math.max(...recipientDistribution.map(d => d.splits), 1);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Splits */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium opacity-90">Total Splits</span>
          <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="text-3xl font-bold mb-1">{totalSplits}</div>
        <div className="text-xs opacity-80">{favoriteSplits} favorites</div>
      </div>

      {/* Total Recipients */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium opacity-90">Total Recipients</span>
          <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="text-3xl font-bold mb-1">{totalRecipients}</div>
        <div className="text-xs opacity-80">Across all splits</div>
      </div>

      {/* Average Recipients */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium opacity-90">Avg Recipients</span>
          <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div className="text-3xl font-bold mb-1">{avgRecipientsPerSplit}</div>
        <div className="text-xs opacity-80">Per split</div>
      </div>

      {/* Avg Percentage */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium opacity-90">Avg Share</span>
          <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <div className="text-3xl font-bold mb-1">{avgPercentage}%</div>
        <div className="text-xs opacity-80">Per recipient</div>
      </div>

      {/* Recipient Distribution Chart */}
      <div className="md:col-span-2 lg:col-span-4 bg-white rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Recipient Distribution
        </h3>
        <div className="space-y-3">
          {recipientDistribution.map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">
                  {item.count} recipients
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {item.splits} splits
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(item.splits / maxSplits) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

