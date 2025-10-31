"use client";

import { SplitWithRecipients } from "@/lib/splits";

interface DashboardStatsProps {
  splits: SplitWithRecipients[];
}

export default function DashboardStats({ splits }: DashboardStatsProps) {
  const totalSplits = splits.length;
  
  const totalRecipients = splits.reduce((sum, split) => {
    return sum + split.recipients.length;
  }, 0);

  const averageRecipientsPerSplit = totalSplits > 0 
    ? (totalRecipients / totalSplits).toFixed(1) 
    : "0";

  const oldestSplit = splits.length > 0 
    ? splits[splits.length - 1] 
    : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Splits */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Total Splits
          </p>
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{totalSplits}</p>
        <p className="text-xs text-gray-500 mt-1">
          Active contracts
        </p>
      </div>

      {/* Total Recipients */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Recipients
          </p>
          <span className="text-2xl">👥</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{totalRecipients}</p>
        <p className="text-xs text-gray-500 mt-1">
          Across all splits
        </p>
      </div>

      {/* Average Recipients */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Avg per Split
          </p>
          <span className="text-2xl">📈</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{averageRecipientsPerSplit}</p>
        <p className="text-xs text-gray-500 mt-1">
          Recipients average
        </p>
      </div>

      {/* First Split */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Member Since
          </p>
          <span className="text-2xl">🚀</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {oldestSplit ? formatDate(oldestSplit.created_at) : "—"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          First split created
        </p>
      </div>
    </div>
  );
}

