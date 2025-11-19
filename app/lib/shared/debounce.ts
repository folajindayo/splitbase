/**
 * Debounce and Throttle Utilities
 * For optimizing event handlers and API calls
 */

/**
 * Debounce function - delays execution until after wait milliseconds
 * have elapsed since the last time it was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once
 * per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
  };
}

/**
 * Debounce with leading and trailing options
 */
export function debounceAdvanced<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  const { leading = false, trailing = true } = options;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;

  return function debounced(...args: Parameters<T>) {
    const now = Date.now();
    const shouldCallNow = leading && now - lastCallTime > wait;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    if (shouldCallNow) {
      func(...args);
      lastCallTime = now;
    }

    if (trailing) {
      timeoutId = setTimeout(() => {
        func(...args);
        lastCallTime = Date.now();
      }, wait);
    }
  };
}

