"use client";

import { useState, useEffect, useCallback } from "react";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  balance: string | null;
}

/**
 * Custom hook for wallet connection management
 * Handles wallet state and connection logic
 */
export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    balance: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No wallet detected");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (accounts.length > 0) {
        setWallet({
          address: accounts[0],
          isConnected: true,
          chainId: parseInt(chainId, 16),
          balance: null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      address: null,
      isConnected: false,
      chainId: null,
      balance: null,
    });
  }, []);

  const switchChain = useCallback(async (targetChainId: number) => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch chain");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setWallet((prev) => ({ ...prev, address: accounts[0] }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      setWallet((prev) => ({ ...prev, chainId: parseInt(chainId, 16) }));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect]);

  return {
    ...wallet,
    isConnecting,
    error,
    connect,
    disconnect,
    switchChain,
  };
}

