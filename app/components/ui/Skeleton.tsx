"use client";

import React from "react";

interface SkeletonProps {
  width?: string;
  height?: string;
  circle?: boolean;
  className?: string;
}

/**
 * Skeleton Component
 * Loading placeholder with customizable dimensions
 */
export default function Skeleton({
  width = "w-full",
  height = "h-4",
  circle = false,
  className = "",
}: SkeletonProps) {
  const shapeClass = circle ? "rounded-full" : "rounded";

  return (
    <div
      className={`animate-pulse bg-gray-200 ${width} ${height} ${shapeClass} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Skeleton variants for common UI patterns
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "w-3/4" : "w-full"}
          height="h-4"
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <Skeleton width="w-24" height="h-24" circle className="mb-4" />
      <Skeleton width="w-3/4" height="h-6" className="mb-2" />
      <SkeletonText lines={2} />
    </div>
  );
}

