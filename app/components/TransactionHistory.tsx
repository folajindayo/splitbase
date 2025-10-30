"use client";

import { useEffect, useState } from "react";
import { useAppKitProvider, useAppKitNetwork } from "@reown/appkit/react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { SPLIT_BASE_ABI } from "@/lib/contracts";
import { formatDate, getBaseScanUrl, truncateAddress } from "@/lib/utils";
import { DEFAULT_CHAIN_ID, QUERY_BLOCK_LIMIT } from "@/lib/constants";

interface RecipientPayment {
  recipient: string;
  amount: string;
}

interface Transaction {
  hash: string;
  amount: string;
  timestamp: number;
  payments: RecipientPayment[];
}

interface TransactionHistoryProps {
  splitAddress: string;
}

export default function TransactionHistory({ splitAddress }: TransactionHistoryProps) {
  const { walletProvider } = useAppKitProvider("eip155");
  const { caipNetwork } = useAppKitNetwork();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const chainId = caipNetwork?.id ? parseInt(caipNetwork.id.toString()) : DEFAULT_CHAIN_ID;

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
      
      // Prefer window.ethereum if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let providerToUse: any = walletProvider;
      if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).ethereum) {
        providerToUse = (window as unknown as Record<string, unknown>).ethereum;
      }
      
      const provider = new BrowserProvider(providerToUse);
      const contract = new Contract(splitAddress, SPLIT_BASE_ABI, provider);

      // Query FundsDistributed events
      const distributedFilter = contract.filters.FundsDistributed();
      const distributedEvents = await contract.queryFilter(distributedFilter, QUERY_BLOCK_LIMIT);

      // Query RecipientPaid events
      const paidFilter = contract.filters.RecipientPaid();
      const paidEvents = await contract.queryFilter(paidFilter, QUERY_BLOCK_LIMIT);

      // Group RecipientPaid events by transaction hash
      const paymentsByTx = new Map<string, RecipientPayment[]>();
      
      for (const event of paidEvents) {
        const txHash = event.transactionHash;
        if (!paymentsByTx.has(txHash)) {
          paymentsByTx.set(txHash, []);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventArgs = (event as any).args;
        paymentsByTx.get(txHash)!.push({
          recipient: eventArgs[0],
          amount: formatEther(eventArgs[1]),
        });
      }

      // Build transactions with payment details
      const txs: Transaction[] = await Promise.all(
        distributedEvents.map(async (event) => {
          const block = await event.getBlock();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const eventArgs = (event as any).args;
          return {
            hash: event.transactionHash,
            amount: formatEther(eventArgs[0]),
            timestamp: block.timestamp,
            payments: paymentsByTx.get(event.transactionHash) || [],
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-medium text-gray-500 mb-4">Transaction History</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-emerald-500"></div>
          <p className="mt-2 text-xs text-gray-400">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">No distributions yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.hash}
              className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Transaction Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {tx.amount} ETH
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(new Date(tx.timestamp * 1000).toISOString())}
                  </p>
                </div>
                <a
                  href={getBaseScanUrl(tx.hash, chainId, "tx")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                >
                  View Tx ↗
                </a>
              </div>

              {/* Recipient Payments */}
              {tx.payments.length > 0 && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  {tx.payments.map((payment, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between text-xs"
                    >
                      <a
                        href={getBaseScanUrl(payment.recipient, chainId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-gray-600 hover:text-emerald-600 transition-colors"
                      >
                        {truncateAddress(payment.recipient, 4)}
                      </a>
                      <span className="text-gray-900 font-medium">
                        {payment.amount} ETH
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

