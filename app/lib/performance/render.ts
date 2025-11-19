/**
 * Render optimization utilities
 */

import { ComponentType } from "react";

export function shouldComponentUpdate<P extends object>(
  prevProps: P,
  nextProps: P,
  keys?: Array<keyof P>
): boolean {
  if (keys) {
    return keys.some((key) => prevProps[key] !== nextProps[key]);
  }

  const prevKeys = Object.keys(prevProps) as Array<keyof P>;
  const nextKeys = Object.keys(nextProps) as Array<keyof P>;

  if (prevKeys.length !== nextKeys.length) {
    return true;
  }

  return prevKeys.some((key) => prevProps[key] !== nextProps[key]);
}

export function createComparator<P extends object>(
  keys: Array<keyof P>
): (prevProps: P, nextProps: P) => boolean {
  return (prevProps, nextProps) => {
    return !shouldComponentUpdate(prevProps, nextProps, keys);
  };
}

export interface RenderCounterOptions {
  enabled?: boolean;
  logToConsole?: boolean;
}

export function useRenderCounter(
  componentName: string,
  options: RenderCounterOptions = {}
) {
  const { enabled = process.env.NODE_ENV === "development", logToConsole = true } = options;

  if (!enabled) return;

  if (typeof window !== "undefined") {
    if (!(window as any).__renderCounts) {
      (window as any).__renderCounts = {};
    }

    const counts = (window as any).__renderCounts;
    counts[componentName] = (counts[componentName] || 0) + 1;

    if (logToConsole && counts[componentName] % 10 === 0) {
      console.log(`[Render Counter] ${componentName}: ${counts[componentName]} renders`);
    }
  }
}

export function getRenderCount(componentName: string): number {
  if (typeof window !== "undefined" && (window as any).__renderCounts) {
    return (window as any).__renderCounts[componentName] || 0;
  }
  return 0;
}

export function clearRenderCounts(): void {
  if (typeof window !== "undefined") {
    (window as any).__renderCounts = {};
  }
}

export function logRenderCounts(): void {
  if (typeof window !== "undefined" && (window as any).__renderCounts) {
    console.table((window as any).__renderCounts);
  }
}

