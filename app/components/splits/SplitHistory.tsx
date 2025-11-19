"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";

interface HistoryEvent {
  id: string;
  type: "created" | "payment" | "edited" | "paused" | "resumed";
  description: string;
  amount?: number;
  timestamp: Date;
  actor?: string;
}

interface SplitHistoryProps {
  events: HistoryEvent[];
}

/**
 * SplitHistory Component
 * Timeline of split events and transactions
 */
export default function SplitHistory({ events }: SplitHistoryProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "created":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            ✨
          </div>
        );
      case "payment":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            💰
          </div>
        );
      case "edited":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
            ✏️
          </div>
        );
      case "paused":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            ⏸️
          </div>
        );
      case "resumed":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            ▶️
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            📋
          </div>
        );
    }
  };

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-500">No history available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">History</h3>

      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.id} className="flex gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">{getEventIcon(event.type)}</div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{event.description}</p>
                  {event.actor && (
                    <p className="mt-1 text-sm text-gray-600">
                      by {event.actor.slice(0, 6)}...{event.actor.slice(-4)}
                    </p>
                  )}
                </div>
                {event.amount !== undefined && (
                  <span className="ml-4 font-semibold text-green-600">
                    +${event.amount.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formatDistanceToNow(new Date(event.timestamp), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

