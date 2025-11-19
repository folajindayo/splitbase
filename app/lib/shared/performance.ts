/**
 * Performance measurement utilities
 */

export class PerformanceTimer {
  private startTime: number;
  private marks: Map<string, number>;

  constructor() {
    this.startTime = performance.now();
    this.marks = new Map();
  }

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark?: string): number {
    const end = performance.now();
    const start = startMark ? this.marks.get(startMark) || this.startTime : this.startTime;
    const duration = end - start;

    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  getElapsed(): number {
    return performance.now() - this.startTime;
  }

  reset(): void {
    this.startTime = performance.now();
    this.marks.clear();
  }
}

export function measureTime<T>(fn: () => T, label?: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  if (label) {
    console.log(`[Time] ${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
}

export async function measureTimeAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  if (label) {
    console.log(`[Time] ${label}: ${(end - start).toFixed(2)}ms`);
  }

  return result;
}

export function debounceFrame<T extends (...args: any[]) => void>(
  fn: T
): (...args: Parameters<T>) => void {
  let frameId: number | null = null;

  return (...args: Parameters<T>) => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }

    frameId = requestAnimationFrame(() => {
      fn(...args);
      frameId = null;
    });
  };
}

export function throttleFrame<T extends (...args: any[]) => void>(
  fn: T
): (...args: Parameters<T>) => void {
  let frameId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  const tick = () => {
    if (lastArgs) {
      fn(...lastArgs);
      lastArgs = null;
      frameId = requestAnimationFrame(tick);
    } else {
      frameId = null;
    }
  };

  return (...args: Parameters<T>) => {
    lastArgs = args;
    if (frameId === null) {
      frameId = requestAnimationFrame(tick);
    }
  };
}
