/**
 * useSplits Hook
 */

'use client';

import { useState, useEffect } from 'react';
import { SplitService, SplitContract } from '../lib/services/split.service';

export function useSplits(ownerAddress: string | null) {
  const [splits, setSplits] = useState<SplitContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerAddress) return;

    const fetchSplits = async () => {
      setLoading(true);
      setError(null);

      try {
        const service = new SplitService();
        const data = await service.getSplits(ownerAddress);
        setSplits(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSplits();
  }, [ownerAddress]);

  return { splits, loading, error };
}

