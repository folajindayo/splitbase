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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new BrowserProvider(walletProvider as any);
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Deposit Funds</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleDeposit}
          disabled={loading || !amount}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Sending..." : "Send ETH"}
        </button>

        <p className="text-xs text-gray-500">
          Funds will automatically distribute to all recipients when received.
        </p>
      </div>
    </div>
  );
}

