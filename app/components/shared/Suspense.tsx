"use client";

import React, { Suspense as ReactSuspense, ReactNode } from "react";

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Suspense Wrapper Component
 * Wrapper around React.Suspense with default fallback
 */
export default function SuspenseWrapper({
  children,
  fallback,
}: SuspenseWrapperProps) {
  const defaultFallback = (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );

  return (
    <ReactSuspense fallback={fallback || defaultFallback}>
      {children}
    </ReactSuspense>
  );
}

/**
 * Page Loading Fallback
 */
export function PageLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <p className="text-lg font-medium text-gray-700">Loading page...</p>
      </div>
    </div>
  );
}

/**
 * Component Loading Fallback
 */
export function ComponentLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
    </div>
  );
}

