"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";

interface CustodyWalletDisplayProps {
  walletAddress: string;
  expectedAmount: string;
  currency: string;
  escrowTitle: string;
}

export default function CustodyWalletDisplay({
  walletAddress,
  expectedAmount,
  currency,
  escrowTitle,
}: CustodyWalletDisplayProps) {
  const [qrCode, setQrCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    generateQRCode();
    checkBalance();
  }, [walletAddress]);

  const generateQRCode = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(walletAddress, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCode(dataUrl);
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  const checkBalance = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/escrow/check-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          chainId: 84532, // Base Sepolia
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.balanceInEth);
      }
    } catch (err) {
      console.error("Error checking balance:", err);
    } finally {
      setChecking(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const isFunded = parseFloat(balance) >= parseFloat(expectedAmount);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-xl text-white">🔒</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Custody Wallet</h3>
          <p className="text-sm text-gray-600">Secure escrow deposit address</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Safe & Secure
            </h4>
            <p className="text-sm text-blue-700">
              SplitBase holds your funds in custody until release. Your funds are safe with us - we act as the trusted intermediary.
            </p>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-4">
        <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
          {qrCode ? (
            <img src={qrCode} alt="Wallet QR Code" className="w-48 h-48" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Address */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deposit Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={walletAddress}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
          />
          <button
            onClick={copyAddress}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-all"
          >
            {copied ? "✓" : "Copy"}
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Amount to deposit:</span>
          <span className="text-xl font-bold text-gray-900">
            {expectedAmount} {currency}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Current balance:</span>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold ${isFunded ? 'text-green-600' : 'text-gray-900'}`}>
              {checking ? "..." : `${parseFloat(balance).toFixed(6)} ${currency}`}
            </span>
            {isFunded && <span className="text-green-600">✓</span>}
          </div>
        </div>
      </div>

      {/* Status */}
      {isFunded ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-sm">Fully Funded!</span>
          </div>
        </div>
      ) : (
        <button
          onClick={checkBalance}
          disabled={checking}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm disabled:opacity-50"
        >
          {checking ? "Checking..." : "🔄 Refresh Balance"}
        </button>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-700">
          ⚠️ Send funds only from your wallet. Do not send from an exchange. Network: Base Sepolia (testnet)
        </p>
      </div>
    </div>
  );
}

