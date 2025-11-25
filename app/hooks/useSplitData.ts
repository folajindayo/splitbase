import { useState, useEffect } from "react";

import { SplitData, splitService } from "@/services/splitService";

interface UseSplitDataResult {
  splits: SplitData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSplitData(address: string): UseSplitDataResult {
  const [splits, setSplits] = useState<SplitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSplits = async () => {
    if (!address) {
      setSplits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await splitService.getSplitsByOwner(address);
      setSplits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load splits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSplits();
  }, [address]);

  return {
    splits,
    loading,
    error,
    refetch: fetchSplits,
  };
}

