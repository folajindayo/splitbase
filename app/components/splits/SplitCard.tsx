"use client";

import React from "react";

interface SplitParticipant {
  address: string;
  percentage: number;
  name?: string;
}

interface SplitCardProps {
  id: string;
  title: string;
  participants: SplitParticipant[];
  totalAmount?: number;
  status: "active" | "paused" | "completed";
  onView?: () => void;
  onEdit?: () => void;
}

/**
 * SplitCard Component
 * Displays split payment information in card format
 */
export default function SplitCard({
  id,
  title,
  participants,
  totalAmount,
  status,
  onView,
  onEdit,
}: SplitCardProps) {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    completed: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">ID: {id.slice(0, 8)}...</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[status]}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700">
          {participants.length} Participants
        </p>
        <div className="mt-2 space-y-2">
          {participants.slice(0, 3).map((participant, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-gray-600">
                {participant.name ||
                  `${participant.address.slice(0, 6)}...${participant.address.slice(-4)}`}
              </span>
              <span className="font-medium text-gray-900">
                {participant.percentage}%
              </span>
            </div>
          ))}
          {participants.length > 3 && (
            <p className="text-xs text-gray-500">
              +{participants.length - 3} more
            </p>
          )}
        </div>
      </div>

      {totalAmount !== undefined && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-600">Total Amount</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            ${totalAmount.toLocaleString()}
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {onView && (
          <button
            onClick={onView}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            View
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

