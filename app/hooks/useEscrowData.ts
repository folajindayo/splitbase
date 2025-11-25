import { useState, useEffect } from "react";

import { EscrowData, escrowService } from "@/services/escrowService";

interface UseEscrowDataResult {
  escrows: EscrowData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEscrowData(address: string): UseEscrowDataResult {
  const [escrows, setEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEscrows = async () => {
    if (!address) {
      setEscrows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await escrowService.getEscrowsByUser(address);
      setEscrows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load escrows");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrows();
  }, [address]);

  return {
    escrows,
    loading,
    error,
    refetch: fetchEscrows,
  };
}

