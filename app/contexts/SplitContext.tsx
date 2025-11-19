"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { SplitData } from "@/services/splitService";

interface SplitState {
  selectedSplit: SplitData | null;
  splits: SplitData[];
  loading: boolean;
  error: string | null;
}

interface SplitContextType {
  state: SplitState;
  setSelectedSplit: (split: SplitData | null) => void;
  setSplits: (splits: SplitData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSplit: (id: string, updates: Partial<SplitData>) => void;
  clearState: () => void;
}

const SplitContext = createContext<SplitContextType | undefined>(undefined);

const initialState: SplitState = {
  selectedSplit: null,
  splits: [],
  loading: false,
  error: null,
};

export function SplitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SplitState>(initialState);

  const setSelectedSplit = (split: SplitData | null) => {
    setState((prev) => ({ ...prev, selectedSplit: split }));
  };

  const setSplits = (splits: SplitData[]) => {
    setState((prev) => ({ ...prev, splits }));
  };

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const updateSplit = (id: string, updates: Partial<SplitData>) => {
    setState((prev) => ({
      ...prev,
      splits: prev.splits.map((split) =>
        split.id === id ? { ...split, ...updates } : split
      ),
      selectedSplit:
        prev.selectedSplit?.id === id
          ? { ...prev.selectedSplit, ...updates }
          : prev.selectedSplit,
    }));
  };

  const clearState = () => {
    setState(initialState);
  };

  return (
    <SplitContext.Provider
      value={{
        state,
        setSelectedSplit,
        setSplits,
        setLoading,
        setError,
        updateSplit,
        clearState,
      }}
    >
      {children}
    </SplitContext.Provider>
  );
}

export function useSplit() {
  const context = useContext(SplitContext);

  if (context === undefined) {
    throw new Error("useSplit must be used within a SplitProvider");
  }

  return context;
}

