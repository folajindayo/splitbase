"use client";

import React from "react";

interface StatusIndicatorProps {
  status: "success" | "warning" | "error" | "info" | "pending";
  label?: string;
  pulse?: boolean;
}

/**
 * StatusIndicator Component
 * Visual status indicator with color coding
 */
export default function StatusIndicator({
  status,
  label,
  pulse = false,
}: StatusIndicatorProps) {
  const statusConfig = {
    success: {
      bg: "bg-green-500",
      text: "text-green-700",
      ring: "ring-green-100",
    },
    warning: {
      bg: "bg-yellow-500",
      text: "text-yellow-700",
      ring: "ring-yellow-100",
    },
    error: {
      bg: "bg-red-500",
      text: "text-red-700",
      ring: "ring-red-100",
    },
    info: {
      bg: "bg-blue-500",
      text: "text-blue-700",
      ring: "ring-blue-100",
    },
    pending: {
      bg: "bg-gray-400",
      text: "text-gray-700",
      ring: "ring-gray-100",
    },
  };

  const config = statusConfig[status];
  const pulseClass = pulse ? "animate-pulse" : "";

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`relative flex h-3 w-3 ${pulseClass}`}>
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.bg} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex h-3 w-3 rounded-full ${config.bg}`}
        />
      </span>
      {label && <span className={`text-sm font-medium ${config.text}`}>{label}</span>}
    </div>
  );
}

