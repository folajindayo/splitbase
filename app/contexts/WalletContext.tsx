"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  connected: boolean;
  connecting: boolean;
}

interface WalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    connected: false,
    connecting: false,
  });

  const connect = async () => {
    setWallet((prev) => ({ ...prev, connecting: true }));

    try {
      // Mock wallet connection - in production, use actual Web3 provider
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockAddress = `0x${Math.random().toString(16).slice(2, 42)}`;
      const mockChainId = 1;

      setWallet({
        address: mockAddress,
        chainId: mockChainId,
        connected: true,
        connecting: false,
      });

      console.log("Wallet connected:", mockAddress);
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setWallet((prev) => ({ ...prev, connecting: false }));
    }
  };

  const disconnect = () => {
    setWallet({
      address: null,
      chainId: null,
      connected: false,
      connecting: false,
    });

    console.log("Wallet disconnected");
  };

  const switchChain = async (chainId: number) => {
    try {
      // Mock chain switching
      await new Promise((resolve) => setTimeout(resolve, 500));

      setWallet((prev) => ({ ...prev, chainId }));

      console.log("Switched to chain:", chainId);
    } catch (error) {
      console.error("Chain switch failed:", error);
      throw error;
    }
  };

  // Auto-connect on mount if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem("wallet_connected");

    if (wasConnected === "true") {
      connect();
    }
  }, []);

  // Save connection state
  useEffect(() => {
    if (wallet.connected) {
      localStorage.setItem("wallet_connected", "true");
    } else {
      localStorage.removeItem("wallet_connected");
    }
  }, [wallet.connected]);

  return (
    <WalletContext.Provider value={{ wallet, connect, disconnect, switchChain }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }

  return context;
}

