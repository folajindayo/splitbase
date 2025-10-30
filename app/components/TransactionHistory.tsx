"use client";

import { useEffect, useState } from "react";
import { useAppKitProvider, useAppKitNetwork } from "@reown/appkit/react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { SPLIT_BASE_ABI } from "@/lib/contracts";
import { formatDate, getBaseScanUrl } from "@/lib/utils";

interface Transaction {
  hash: string;
  amount: string;
  timestamp: number;
}

interface TransactionHistoryProps {
  splitAddress: string;
}

export default function TransactionHistory({ splitAddress }: TransactionHistoryProps) {
  const { walletProvider } = useAppKitProvider("eip155");
  const { caipNetwork } = useAppKitNetwork();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const chainId = caipNetwork?.id ? parseInt(caipNetwork.id.toString()) : 84532;

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitAddress, walletProvider]);

  const loadTransactions = async () => {
    if (!walletProvider) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new BrowserProvider(walletProvider as any);
      const contract = new Contract(splitAddress, SPLIT_BASE_ABI, provider);

      // Query FundsDistributed events
      const filter = contract.filters.FundsDistributed();
      const events = await contract.queryFilter(filter, -10000); // Last ~10k blocks

      const txs: Transaction[] = await Promise.all(
        events.map(async (event) => {
          const block = await event.getBlock();
          return {
            hash: event.transactionHash,
            amount: formatEther(event.args[0]),
            timestamp: block.timestamp,
          };
        })
      );

      setTransactions(txs.reverse()); // Most recent first
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4">Transaction History</h2>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-sm">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No distributions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.hash}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900">
                  {tx.amount} ETH
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(new Date(tx.timestamp * 1000).toISOString())}
                </p>
              </div>
              <a
                href={getBaseScanUrl(tx.hash, chainId, "tx")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Tx ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

