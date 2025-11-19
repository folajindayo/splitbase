"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";

interface Escrow {
  id: string;
  title: string;
  amount: number;
  status: string;
  createdAt: string;
  participants: string[];
}

/**
 * Custom hook for escrow operations
 * Handles CRUD operations for escrows
 */
export function useEscrow() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEscrows = useCallback(async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/api/escrows?address=${address}`);
      setEscrows(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch escrows");
    } finally {
      setLoading(false);
    }
  }, []);

  const createEscrow = useCallback(async (data: Partial<Escrow>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post("/api/escrows", data);
      setEscrows((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create escrow");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEscrow = useCallback(async (id: string, data: Partial<Escrow>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.put(`/api/escrows/${id}`, data);
      setEscrows((prev) =>
        prev.map((escrow) => (escrow.id === id ? response.data : escrow))
      );
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update escrow");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEscrow = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.delete(`/api/escrows/${id}`);
      setEscrows((prev) => prev.filter((escrow) => escrow.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete escrow");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    escrows,
    loading,
    error,
    fetchEscrows,
    createEscrow,
    updateEscrow,
    deleteEscrow,
  };
}

