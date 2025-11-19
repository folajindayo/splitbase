"use client";

import React from "react";

interface EscrowStatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * EscrowStatusBadge Component
 * Displays escrow status with appropriate styling
 */
export default function EscrowStatusBadge({
  status,
  className = "",
}: EscrowStatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: "Pending",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      dotColor: "bg-yellow-500",
    },
    active: {
      label: "Active",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      dotColor: "bg-blue-500",
    },
    funded: {
      label: "Funded",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      dotColor: "bg-green-500",
    },
    released: {
      label: "Released",
      bgColor: "bg-purple-100",
      textColor: "text-purple-800",
      dotColor: "bg-purple-500",
    },
    completed: {
      label: "Completed",
      bgColor: "bg-gray-100",
      textColor: "text-gray-800",
      dotColor: "bg-gray-500",
    },
    disputed: {
      label: "Disputed",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      dotColor: "bg-red-500",
    },
    cancelled: {
      label: "Cancelled",
      bgColor: "bg-gray-100",
      textColor: "text-gray-600",
      dotColor: "bg-gray-400",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      <span className={`mr-1.5 h-2 w-2 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}

