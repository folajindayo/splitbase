"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "release";
  amount: number;
  currency: string;
  from: string;
  to: string;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
  hash?: string;
}

interface CustodyTransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
}

/**
 * CustodyTransactionList Component
 * Displays custody wallet transaction history
 */
export default function CustodyTransactionList({
  transactions,
  loading = false,
}: CustodyTransactionListProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return "↓";
      case "withdrawal":
        return "↑";
      case "release":
        return "→";
      default:
        return "•";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-green-600";
      case "withdrawal":
        return "text-red-600";
      case "release":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${
          variants[status as keyof typeof variants]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl ${getTypeColor(
                  tx.type
                )}`}
              >
                {getTypeIcon(tx.type)}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">
                    {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                  </p>
                  {getStatusBadge(tx.status)}
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    From: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                  </span>
                  <span>→</span>
                  <span>
                    To: {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(tx.timestamp), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className={`text-lg font-semibold ${getTypeColor(tx.type)}`}>
                {tx.type === "withdrawal" ? "-" : "+"}
                {tx.amount} {tx.currency}
              </p>
              {tx.hash && (
                <a
                  href={`https://etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  View on Explorer
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

