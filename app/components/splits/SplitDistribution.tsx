"use client";

import React from "react";

interface Participant {
  address: string;
  percentage: number;
  amount?: number;
  name?: string;
}

interface SplitDistributionProps {
  participants: Participant[];
  totalAmount?: number;
}

/**
 * SplitDistribution Component
 * Visual representation of split distribution
 */
export default function SplitDistribution({
  participants,
  totalAmount,
}: SplitDistributionProps) {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-cyan-500",
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Distribution Overview
      </h3>

      {/* Progress Bar Visualization */}
      <div className="mb-6 flex h-8 w-full overflow-hidden rounded-lg">
        {participants.map((participant, index) => (
          <div
            key={index}
            className={`${colors[index % colors.length]} flex items-center justify-center text-xs font-medium text-white`}
            style={{ width: `${participant.percentage}%` }}
            title={`${participant.percentage}%`}
          >
            {participant.percentage > 10 && `${participant.percentage}%`}
          </div>
        ))}
      </div>

      {/* Participant List */}
      <div className="space-y-3">
        {participants.map((participant, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-4 w-4 rounded ${colors[index % colors.length]}`}
              />
              <div>
                <p className="font-medium text-gray-900">
                  {participant.name ||
                    `${participant.address.slice(0, 6)}...${participant.address.slice(-4)}`}
                </p>
                {participant.name && (
                  <p className="text-xs text-gray-500">
                    {participant.address.slice(0, 10)}...
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {participant.percentage}%
              </p>
              {totalAmount !== undefined && participant.amount !== undefined && (
                <p className="text-sm text-gray-600">
                  ${participant.amount.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      {totalAmount !== undefined && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">Total Amount</span>
            <span className="text-xl font-bold text-gray-900">
              ${totalAmount.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

