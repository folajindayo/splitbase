"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CustodyBalance {
  token: string;
  balance: string;
  usdValue: number;
}

interface CustodyState {
  balances: CustodyBalance[];
  totalValue: number;
  loading: boolean;
  error: string | null;
}

interface CustodyContextType {
  state: CustodyState;
  setBalances: (balances: CustodyBalance[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshBalances: () => Promise<void>;
}

const CustodyContext = createContext<CustodyContextType | undefined>(undefined);

const initialState: CustodyState = {
  balances: [],
  totalValue: 0,
  loading: false,
  error: null,
};

export function CustodyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CustodyState>(initialState);

  const setBalances = (balances: CustodyBalance[]) => {
    const totalValue = balances.reduce((sum, b) => sum + b.usdValue, 0);
    setState((prev) => ({ ...prev, balances, totalValue }));
  };

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const refreshBalances = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch balances from API
      // This would call the actual custody service
      // For now, this is a placeholder
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh balances");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustodyContext.Provider
      value={{
        state,
        setBalances,
        setLoading,
        setError,
        refreshBalances,
      }}
    >
      {children}
    </CustodyContext.Provider>
  );
}

export function useCustody() {
  const context = useContext(CustodyContext);

  if (context === undefined) {
    throw new Error("useCustody must be used within a CustodyProvider");
  }

  return context;
}

