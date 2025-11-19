"use client";

import React from "react";

interface Milestone {
  id: string;
  title: string;
  percentage: number;
  status: "pending" | "active" | "completed";
  amount: number;
}

interface EscrowProgressProps {
  milestones: Milestone[];
  currentMilestone?: number;
}

/**
 * EscrowProgress Component
 * Visual progress tracker for escrow milestones
 */
export default function EscrowProgress({
  milestones,
  currentMilestone = 0,
}: EscrowProgressProps) {
  const totalCompleted = milestones
    .filter((m) => m.status === "completed")
    .reduce((sum, m) => sum + m.percentage, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>
        <span className="text-sm font-medium text-gray-600">
          {totalCompleted}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${totalCompleted}%` }}
        />
      </div>

      {/* Milestone List */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <div
            key={milestone.id}
            className="flex items-start gap-4 border-l-2 border-gray-200 pl-4"
          >
            <div className="flex-shrink-0">
              {milestone.status === "completed" ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              ) : milestone.status === "active" ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-blue-600" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full border-2 border-gray-300 bg-white" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                <span className="text-sm font-medium text-gray-600">
                  {milestone.percentage}%
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                ${milestone.amount.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

