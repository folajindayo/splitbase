import { useEffect, useRef, useCallback } from "react";

interface UsePollingOptions {
  interval: number;
  enabled?: boolean;
  runImmediately?: boolean;
}

export function usePolling(
  callback: () => void | Promise<void>,
  options: UsePollingOptions
): { start: () => void; stop: () => void } {
  const { interval, enabled = true, runImmediately = false } = options;
  const intervalRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const start = useCallback(() => {
    stop();

    if (enabled) {
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, interval);
    }
  }, [interval, enabled, stop]);

  useEffect(() => {
    if (enabled) {
      if (runImmediately) {
        callbackRef.current();
      }

      start();
    }

    return () => {
      stop();
    };
  }, [enabled, runImmediately, start, stop]);

  return { start, stop };
}

