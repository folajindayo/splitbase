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
import SplitAnalytics from "@/components/SplitAnalytics";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import ShareableSplit from "@/components/ShareableSplit";
import { DEFAULT_CHAIN_ID } from "@/lib/constants";

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

  const chainId = caipNetwork?.id ? parseInt(caipNetwork.id.toString()) : DEFAULT_CHAIN_ID;

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
      
      // Prefer window.ethereum if available (direct connection)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let providerToUse: any = walletProvider;
      if (typeof window !== 'undefined' && window.ethereum) {
        providerToUse = window.ethereum;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new BrowserProvider(providerToUse as any);
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-emerald-500"></div>
            <p className="mt-4 text-sm text-gray-500">Loading split details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!splitData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Split Not Found</h2>
            <p className="text-sm text-gray-500">This contract doesn&apos;t exist or hasn&apos;t been indexed yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const recipients = splitData.recipients || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Split Contract</h1>
          
          {/* Contract Address Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Contract Address</p>
                <p className="font-mono text-sm font-medium text-gray-900">{splitAddress}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <a
                  href={getBaseScanUrl(splitAddress, chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
                >
                  BaseScan ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-3">Balance</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-semibold text-gray-900">{balance}</span>
                <span className="text-lg text-gray-500">ETH</span>
              </div>
              {parseFloat(balance) > 0 && (
                <button
                  onClick={handleDistribute}
                  disabled={distributing}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {distributing ? "Distributing..." : "Distribute Now"}
                </button>
              )}
            </div>

            {/* Recipients Table */}
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-medium text-gray-500 mb-4">Recipients</h2>
                <div className="space-y-3">
                  {(recipients as Array<{ wallet_address: string; percentage: number }>).map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <a
                        href={getBaseScanUrl(recipient.wallet_address, chainId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        {truncateAddress(recipient.wallet_address, 6)}
                      </a>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-medium">
                        {recipient.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction History */}
              <TransactionHistory splitAddress={splitAddress} />

              {/* Analytics Dashboard */}
              {walletProvider && (
                <SplitAnalytics 
                  splitAddress={splitAddress}
                  walletProvider={walletProvider}
                />
              )}
            </>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deposit Card */}
            {isConnected && <DepositFunds splitAddress={splitAddress} onSuccess={loadSplitData} />}

            {/* QR Code Generator */}
            <QRCodeGenerator address={splitAddress} />

            {/* Shareable Split */}
            <ShareableSplit 
              splitAddress={splitAddress}
              recipients={recipients}
              totalDistributed={splitData.totalDistributed}
            />

            {/* Info Card */}
            <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5">
              <h3 className="text-sm font-medium text-emerald-900 mb-3">How it works</h3>
              <ul className="text-xs text-emerald-700 space-y-2">
                <li>• Send ETH to contract address</li>
                <li>• Auto-distribute to recipients</li>
                <li>• Each gets their % share</li>
                <li>• All transactions on-chain</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

