import { useState, useCallback } from "react";

interface OptimisticUpdate<T> {
  data: T | null;
  isOptimistic: boolean;
  error: string | null;
}

interface UseOptimisticUpdateResult<T> {
  data: T | null;
  isOptimistic: boolean;
  error: string | null;
  performUpdate: (
    optimisticData: T,
    updateFn: () => Promise<T>
  ) => Promise<void>;
  reset: () => void;
}

export function useOptimisticUpdate<T>(): UseOptimisticUpdateResult<T> {
  const [state, setState] = useState<OptimisticUpdate<T>>({
    data: null,
    isOptimistic: false,
    error: null,
  });

  const performUpdate = useCallback(
    async (optimisticData: T, updateFn: () => Promise<T>) => {
      // Set optimistic data immediately
      setState({
        data: optimisticData,
        isOptimistic: true,
        error: null,
      });

      try {
        // Perform actual update
        const actualData = await updateFn();

        // Update with real data
        setState({
          data: actualData,
          isOptimistic: false,
          error: null,
        });
      } catch (error) {
        // Revert on error
        setState({
          data: null,
          isOptimistic: false,
          error: error instanceof Error ? error.message : "Update failed",
        });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      isOptimistic: false,
      error: null,
    });
  }, []);

  return {
    data: state.data,
    isOptimistic: state.isOptimistic,
    error: state.error,
    performUpdate,
    reset,
  };
}

