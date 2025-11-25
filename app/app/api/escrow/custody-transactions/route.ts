import { JsonRpcProvider } from "ethers";
import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { custodyAddress, chainId, limit = 10 } = await req.json();

    if (!custodyAddress) {
      return NextResponse.json(
        { error: "Custody address is required" },
        { status: 400 }
      );
    }

    // Get RPC URL based on chain ID
    const rpcUrl = chainId === 84532
      ? "https://sepolia.base.org"
      : "https://mainnet.base.org";

    const provider = new JsonRpcProvider(rpcUrl);

    // Get current block number
    const currentBlock = await provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlock - 10000); // Check last ~10000 blocks

    // Get transaction history
    // Note: This is a simplified version. In production, use a block explorer API
    const transactions = [];

    try {
      // Get all escrow activities for this custody wallet
      const { data: escrow } = await supabase
        .from("escrows")
        .select("id, title, activities:escrow_activities(*)")
        .eq("custody_wallet_address", custodyAddress)
        .single();

      if (escrow) {
        // Get balance history from activities
        const activities = escrow.activities || [];
        
        for (const activity of activities.slice(0, limit)) {
          transactions.push({
            type: activity.action_type,
            date: activity.created_at,
            actor: activity.actor_address,
            message: activity.message,
            metadata: activity.metadata,
            escrowTitle: escrow.title,
          });
        }
      }

      // Get current balance
      const balance = await provider.getBalance(custodyAddress);
      const balanceInEth = (Number(balance) / 1e18).toFixed(6);

      return NextResponse.json({
        address: custodyAddress,
        balance: balanceInEth,
        currency: "ETH",
        transactions,
        blockRange: {
          from: startBlock,
          to: currentBlock,
        },
      });
    } catch (err) {
      console.error("Error fetching transactions:", err);
      
      // Return basic info even if transaction fetch fails
      const balance = await provider.getBalance(custodyAddress);
      const balanceInEth = (Number(balance) / 1e18).toFixed(6);

      return NextResponse.json({
        address: custodyAddress,
        balance: balanceInEth,
        currency: "ETH",
        transactions: [],
        error: "Could not fetch transaction history",
      });
    }
  } catch (error) {
    console.error("Error fetching custody transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch custody transactions" },
      { status: 500 }
    );
  }
}

