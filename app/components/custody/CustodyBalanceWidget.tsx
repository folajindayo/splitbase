"use client";

import { useState, useEffect } from "react";
import { JsonRpcProvider } from "ethers";
import { supabase } from "@/lib/supabase";

interface CustodyBalance {
  totalEscrows: number;
  totalBalance: string;
  fundedEscrows: number;
  pendingEscrows: number;
}

export default function CustodyBalanceWidget() {
  const [balance, setBalance] = useState<CustodyBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustodyBalances();
  }, []);

  const loadCustodyBalances = async () => {
    setLoading(true);
    try {
      // Get all escrows with custody wallets
      const { data: escrows, error } = await supabase
        .from("escrows")
        .select("id, status, custody_wallet_address, total_amount")
        .not("custody_wallet_address", "is", null);

      if (error) {
        console.error("Error fetching escrows:", error);
        return;
      }

      if (!escrows || escrows.length === 0) {
        setBalance({
          totalEscrows: 0,
          totalBalance: "0",
          fundedEscrows: 0,
          pendingEscrows: 0,
        });
        return;
      }

      const provider = new JsonRpcProvider("https://sepolia.base.org");
      
      let totalBalanceWei = BigInt(0);
      let fundedCount = 0;
      let pendingCount = 0;

      // Check balance for each custody wallet
      for (const escrow of escrows) {
        if (escrow.custody_wallet_address) {
          try {
            const walletBalance = await provider.getBalance(escrow.custody_wallet_address);
            totalBalanceWei += walletBalance;

            if (escrow.status === "funded") fundedCount++;
            if (escrow.status === "pending") pendingCount++;
          } catch (err) {
            console.error(`Error checking balance for ${escrow.custody_wallet_address}:`, err);
          }
        }
      }

      const totalBalanceEth = (Number(totalBalanceWei) / 1e18).toFixed(6);

      setBalance({
        totalEscrows: escrows.length,
        totalBalance: totalBalanceEth,
        fundedEscrows: fundedCount,
        pendingEscrows: pendingCount,
      });
    } catch (err) {
      console.error("Error loading custody balances:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-xl text-white">🔒</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Custody Balance</h3>
            <p className="text-sm text-gray-600">Platform holdings</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
          <span className="text-xl text-white">🔒</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Custody Balance</h3>
          <p className="text-sm text-gray-600">Platform holdings</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Total Balance */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total in Custody</div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {balance.totalBalance}
          </div>
          <div className="text-sm font-medium text-gray-500">ETH</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {balance.totalEscrows}
            </div>
            <div className="text-xs text-gray-600">Total Escrows</div>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-700 mb-1">
              {balance.fundedEscrows}
            </div>
            <div className="text-xs text-green-600">Funded</div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-700 mb-1">
              {balance.pendingEscrows}
            </div>
            <div className="text-xs text-yellow-600">Pending</div>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadCustodyBalances}
          className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium text-sm transition-colors"
        >
          🔄 Refresh Balances
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          SplitBase securely holds these funds in custody until release
        </p>
      </div>
    </div>
  );
}

