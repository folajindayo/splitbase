"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppKitAccount, useAppKitProvider, useAppKitNetwork } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import { getSplitDetails, getSplitBalance } from "@/lib/contracts";
import { getSplitByAddress } from "@/lib/splits";
import { truncateAddress, getBaseScanUrl, copyToClipboard } from "@/lib/utils";
import DepositFunds from "@/components/DepositFunds";
import TransactionHistory from "@/components/TransactionHistory";

export default function SplitDetailsPage() {
  const params = useParams();
  const splitAddress = params.address as string;
  
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { caipNetwork } = useAppKitNetwork();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [splitData, setSplitData] = useState<any>(null);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [distributing, setDistributing] = useState(false);

  const chainId = caipNetwork?.id ? parseInt(caipNetwork.id.toString()) : 84532;

  useEffect(() => {
    loadSplitData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitAddress, walletProvider]);

  const loadSplitData = async () => {
    try {
      setLoading(true);

      // Load from database
      const dbSplit = await getSplitByAddress(splitAddress);

      // Load from blockchain
      if (walletProvider) {
        // Prefer window.ethereum if available (direct connection)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let providerToUse: any = walletProvider;
        if (typeof window !== 'undefined' && window.ethereum) {
          providerToUse = window.ethereum;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const provider = new BrowserProvider(providerToUse as any);
        const details = await getSplitDetails(provider, splitAddress);
        const currentBalance = await getSplitBalance(provider, splitAddress);
        
        // Normalize recipients data structure
        // Database has: { wallet_address, percentage }
        // Blockchain has: { recipients: string[], percentages: bigint[] }
        let normalizedRecipients = dbSplit?.recipients || [];
        
        if (details.recipients && details.percentages) {
          normalizedRecipients = details.recipients.map((addr: string, idx: number) => ({
            wallet_address: addr,
            percentage: Number(details.percentages[idx])
          }));
        }
        
        setSplitData({
          ...dbSplit,
          ...details,
          recipients: normalizedRecipients,
        });
        setBalance(currentBalance);
      } else if (dbSplit) {
        setSplitData(dbSplit);
      }
    } catch (error) {
      console.error("Failed to load split data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(splitAddress);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDistribute = async () => {
    if (!walletProvider) return;

    try {
      setDistributing(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();
      
      const { distributeFunds } = await import("@/lib/contracts");
      await distributeFunds(signer, splitAddress);
      
      // Refresh balance
      await loadSplitData();
    } catch (err) {
      console.error("Failed to distribute:", err);
      const error = err as Error;
      alert(error.message || "Failed to distribute funds");
    } finally {
      setDistributing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading split details...</p>
        </div>
      </div>
    );
  }

  if (!splitData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Split Not Found</h2>
          <p className="text-gray-600">This split contract doesn&apos;t exist or hasn&apos;t been indexed yet.</p>
        </div>
      </div>
    );
  }

  const recipients = splitData.recipients || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Split Details</h1>
        
        {/* Contract Address */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Contract Address</p>
              <p className="font-mono text-lg font-semibold">{splitAddress}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <a
                href={getBaseScanUrl(splitAddress, chainId)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                View on BaseScan ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Balance Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Contract Balance</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{balance}</span>
              <span className="text-2xl text-gray-600">ETH</span>
            </div>
            {parseFloat(balance) > 0 && (
              <button
                onClick={handleDistribute}
                disabled={distributing}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {distributing ? "Distributing..." : "Distribute Now"}
              </button>
            )}
          </div>

          {/* Recipients Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Recipients</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Address
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((recipient: { wallet_address: string; percentage: number }, index: number) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <a
                          href={getBaseScanUrl(recipient.wallet_address, chainId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-600 hover:text-blue-700"
                        >
                          {truncateAddress(recipient.wallet_address, 6)}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {recipient.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction History */}
          <TransactionHistory splitAddress={splitAddress} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deposit Card */}
          {isConnected && <DepositFunds splitAddress={splitAddress} onSuccess={loadSplitData} />}

          {/* Info Card */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="font-semibold mb-2">ℹ️ How it works</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Send ETH to the contract address</li>
              <li>• Funds auto-distribute to recipients</li>
              <li>• Each recipient gets their % share</li>
              <li>• All transactions are on-chain</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

