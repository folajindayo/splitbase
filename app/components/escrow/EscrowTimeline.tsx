"use client";

import { useState } from "react";

interface TimelineEvent {
  id: string;
  type: "created" | "funded" | "milestone_released" | "completed" | "disputed" | "cancelled" | "note";
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

interface EscrowTimelineProps {
  events: TimelineEvent[];
  escrowStatus: string;
}

export default function EscrowTimeline({ events, escrowStatus }: EscrowTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  
  const visibleEvents = expanded ? events : events.slice(0, 5);
  const hasMore = events.length > 5;

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return "📝";
      case "funded":
        return "💰";
      case "milestone_released":
        return "✅";
      case "completed":
        return "🎉";
      case "disputed":
        return "⚠️";
      case "cancelled":
        return "❌";
      case "note":
        return "📌";
      default:
        return "📍";
    }
  };

  const getEventColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return "bg-blue-500";
      case "funded":
        return "bg-green-500";
      case "milestone_released":
        return "bg-purple-500";
      case "completed":
        return "bg-green-600";
      case "disputed":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      case "note":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            escrowStatus === "pending" ? "bg-yellow-500" :
            escrowStatus === "funded" ? "bg-green-500" :
            escrowStatus === "released" ? "bg-blue-500" :
            escrowStatus === "cancelled" ? "bg-red-500" :
            "bg-gray-500"
          }`}></div>
          <span className="text-sm text-gray-600 capitalize">{escrowStatus}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {visibleEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No activity yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleEvents.map((event, index) => (
              <div key={event.id} className="relative flex gap-4">
                {/* Timeline Line */}
                {index < visibleEvents.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gray-200"></div>
                )}

                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getEventColor(event.type)} flex items-center justify-center text-white relative z-10`}>
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                      )}
                      {event.amount && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          {event.amount} ETH
                        </p>
                      )}
                      {event.actor && (
                        <p className="text-xs text-gray-500 mt-1">
                          By: {shortenAddress(event.actor)}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-gray-500">
                        {formatDate(event.timestamp)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(event.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-2 bg-gray-50 rounded p-2 text-xs text-gray-600">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium capitalize">{key.replace(/_/g, " ")}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show More/Less Button */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-6 w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {expanded ? "Show Less" : `Show ${events.length - 5} More Events`}
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          All times shown in your local timezone • Total events: {events.length}
        </p>
      </div>
    </div>
  );
}

