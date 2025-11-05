"use client";

import { useState } from "react";
import { generatePaymentReference } from "@/lib/wallet";

interface FundingInstructionsProps {
  escrowId: string;
  escrowTitle: string;
  amount: number;
  currency: string;
  depositAddress: string;
  onFunded: (txHash: string) => void;
  loading: boolean;
}

export default function FundingInstructions({
  escrowId,
  escrowTitle,
  amount,
  currency,
  depositAddress,
  onFunded,
  loading,
}: FundingInstructionsProps) {
  const [txHash, setTxHash] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const paymentReference = generatePaymentReference(escrowId);

  const copyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">💰</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fund Your Escrow</h3>
          <p className="text-sm text-gray-600 mt-1">
            Send funds to our custodial wallet to activate this escrow
          </p>
        </div>
      </div>

      {/* Custody Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              🔒 Secure Custody
            </h4>
            <p className="text-sm text-blue-700">
              SplitBase holds your funds in a secure custodial wallet. Funds will only be released when you approve or when escrow conditions are met.
            </p>
          </div>
        </div>
      </div>

      {/* Funding Details */}
      <div className="space-y-4 mb-6">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Send
          </label>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-lg font-bold text-gray-900">
              {amount} {currency}
            </div>
            <button
              onClick={() => copyToClipboard(amount.toString(), setCopiedAmount)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              {copiedAmount ? "✓" : "Copy"}
            </button>
          </div>
        </div>

        {/* Custodial Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Send To (Custodial Wallet)
          </label>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm text-gray-900 break-all">
              {depositAddress}
            </div>
            <button
              onClick={() => copyToClipboard(depositAddress, setCopiedAddress)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              {copiedAddress ? "✓" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This is SplitBase's secure custodial wallet
          </p>
        </div>

        {/* Payment Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Reference (Optional)
          </label>
          <div className="px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg font-mono text-sm font-bold text-yellow-900">
            {paymentReference}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Include this in transaction data to help us identify your payment faster
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">How to Fund:</h4>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">1.</span>
            <span>Open your crypto wallet (MetaMask, Coinbase Wallet, etc.)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">2.</span>
            <span>Send <strong>{amount} {currency}</strong> to the custodial wallet address above</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">3.</span>
            <span>Copy your transaction hash after sending</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-600">4.</span>
            <span>Paste the transaction hash below and click "Verify & Mark as Funded"</span>
          </li>
        </ol>
      </div>

      {/* Transaction Hash Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Transaction Hash
        </label>
        <input
          type="text"
          placeholder="0x..."
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          disabled={loading}
        />
        <button
          onClick={() => onFunded(txHash)}
          disabled={loading || !txHash}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow transition-all"
        >
          {loading ? "Verifying..." : "Verify & Mark as Funded"}
        </button>
      </div>

      {/* Warning */}
      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>⚠️ Important:</strong> Make sure you send the exact amount to the correct address. 
          We will verify the transaction on the blockchain before marking your escrow as funded.
        </p>
      </div>
    </div>
  );
}

