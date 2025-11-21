/**
 * useSplitCreation Hook
 */

import { useState, useCallback } from 'react';

export function useSplitCreation() {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createSplit = useCallback(async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/splits/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPayment(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { payment, loading, error, createSplit };
}

