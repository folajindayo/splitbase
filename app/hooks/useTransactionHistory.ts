import { useState, useEffect } from "react";
import { Transaction, custodyService } from "@/services/custodyService";

interface UseTransactionHistoryResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  loadMore: () => void;
  refetch: () => Promise<void>;
}

export function useTransactionHistory(
  address: string,
  limit: number = 20
): UseTransactionHistoryResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTransactions = async (reset: boolean = false) => {
    if (!address) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 1 : page;
      const result = await custodyService.getTransactionHistory(
        address,
        currentPage,
        limit
      );

      if (reset) {
        setTransactions(result.data);
        setPage(1);
      } else {
        setTransactions((prev) => [...prev, ...result.data]);
      }

      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const hasMore = transactions.length < total;
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const refetch = async () => {
    await fetchTransactions(true);
  };

  useEffect(() => {
    fetchTransactions(true);
  }, [address]);

  useEffect(() => {
    if (page > 1) {
      fetchTransactions(false);
    }
  }, [page]);

  const hasMore = transactions.length < total;

  return {
    transactions,
    loading,
    error,
    pagination: {
      page,
      limit,
      total,
      hasMore,
    },
    loadMore,
    refetch,
  };
}

