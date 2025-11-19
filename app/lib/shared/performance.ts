/**
 * Performance utilities
 * Functions for measuring and optimizing performance
 */

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  label: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`[${label}] took ${(end - start).toFixed(2)}ms`);
  return result;
}

/**
 * Create a memoized version of a function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          lastCall = Date.now();
          fn(...args);
        },
        delay - (now - lastCall)
      );
    }
  };
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Lazy load a component or module
 */
export function lazyLoad<T>(
  loader: () => Promise<T>,
  fallback?: T
): () => Promise<T> {
  let cached: T | null = null;
  let loading: Promise<T> | null = null;

  return async () => {
    if (cached) return cached;
    if (loading) return loading;

    loading = loader();
    cached = await loading;
    loading = null;

    return cached || (fallback as T);
  };
}

/**
 * Batch multiple calls into a single execution
 */
export function batch<T>(
  fn: (items: T[]) => void | Promise<void>,
  delay: number = 50
): (item: T) => void {
  let items: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;

  return (item: T) => {
    items.push(item);

    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(async () => {
      const itemsToProcess = [...items];
      items = [];
      await fn(itemsToProcess);
    }, delay);
  };
}

/**
 * Request idle callback wrapper
 */
export function runWhenIdle(
  fn: () => void,
  options?: IdleRequestOptions
): void {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(fn, options);
  } else {
    setTimeout(fn, 1);
  }
}

