"use client";

import { SplitWithRecipients } from "@/lib/splits";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface RecentActivityProps {
  splits: SplitWithRecipients[];
}

export default function RecentActivity({ splits }: RecentActivityProps) {
  // Get 5 most recent splits
  const recentSplits = [...splits]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (recentSplits.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Activity
        </h3>
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div className="space-y-3">
        {recentSplits.map((split) => (
          <Link
            key={split.id}
            href={`/splits/${split.contract_address}`}
            className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {split.name || "Untitled Split"}
                  </span>
                  {split.is_favorite && <span>⭐</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Created {formatDate(split.created_at)}</span>
                  <span>•</span>
                  <span>{split.recipients.length} recipients</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

