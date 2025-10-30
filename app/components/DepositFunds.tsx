"use client";

import { useState } from "react";
import { useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider, parseEther } from "ethers";

interface DepositFundsProps {
  splitAddress: string;
  onSuccess: () => void;
}

export default function DepositFunds({ splitAddress, onSuccess }: DepositFundsProps) {
  const { walletProvider } = useAppKitProvider("eip155");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeposit = async () => {
    if (!walletProvider || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Prefer window.ethereum if available (direct connection)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let providerToUse: any = walletProvider;
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        providerToUse = (window as any).ethereum;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new BrowserProvider(providerToUse as any);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to: splitAddress,
        value: parseEther(amount),
      });

      await tx.wait();

      // Success
      setAmount("");
      onSuccess();
    } catch (err: any) {
      console.error("Failed to deposit:", err);
      setError(err.message || "Failed to send transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-medium text-gray-500 mb-4">Deposit Funds</h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-2">
            Amount (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            placeholder="0.0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleDeposit}
          disabled={loading || !amount}
          className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed text-sm font-medium"
        >
          {loading ? "Sending..." : "Send ETH"}
        </button>

        <p className="text-xs text-gray-400">
          Funds auto-distribute to recipients
        </p>
      </div>
    </div>
  );
}

