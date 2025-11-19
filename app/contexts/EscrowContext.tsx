"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { EscrowData } from "@/services/escrowService";

interface EscrowState {
  selectedEscrow: EscrowData | null;
  escrows: EscrowData[];
  loading: boolean;
  error: string | null;
}

interface EscrowContextType {
  state: EscrowState;
  setSelectedEscrow: (escrow: EscrowData | null) => void;
  setEscrows: (escrows: EscrowData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearState: () => void;
}

const EscrowContext = createContext<EscrowContextType | undefined>(undefined);

const initialState: EscrowState = {
  selectedEscrow: null,
  escrows: [],
  loading: false,
  error: null,
};

export function EscrowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EscrowState>(initialState);

  const setSelectedEscrow = (escrow: EscrowData | null) => {
    setState((prev) => ({ ...prev, selectedEscrow: escrow }));
  };

  const setEscrows = (escrows: EscrowData[]) => {
    setState((prev) => ({ ...prev, escrows }));
  };

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const clearState = () => {
    setState(initialState);
  };

  return (
    <EscrowContext.Provider
      value={{
        state,
        setSelectedEscrow,
        setEscrows,
        setLoading,
        setError,
        clearState,
      }}
    >
      {children}
    </EscrowContext.Provider>
  );
}

export function useEscrow() {
  const context = useContext(EscrowContext);

  if (context === undefined) {
    throw new Error("useEscrow must be used within an EscrowProvider");
  }

  return context;
}

