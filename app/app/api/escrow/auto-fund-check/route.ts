import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider } from "ethers";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/escrow";

export async function POST(req: NextRequest) {
  try {
    const { escrowId, chainId } = await req.json();

    if (!escrowId) {
      return NextResponse.json(
        { error: "Escrow ID is required" },
        { status: 400 }
      );
    }

    // Get escrow from database
    const { data: escrow, error: fetchError } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrowId)
      .single();

    if (fetchError || !escrow) {
      return NextResponse.json(
        { error: "Escrow not found" },
        { status: 404 }
      );
    }

    // Only check if status is pending
    if (escrow.status !== "pending") {
      return NextResponse.json({
        alreadyFunded: true,
        status: escrow.status,
      });
    }

    if (!escrow.custody_wallet_address) {
      return NextResponse.json(
        { error: "Custody wallet not configured" },
        { status: 400 }
      );
    }

    // Get RPC URL based on chain ID
    const rpcUrl = chainId === 84532
      ? "https://sepolia.base.org"
      : "https://mainnet.base.org";

    const provider = new JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(escrow.custody_wallet_address);

    const balanceInEth = Number(balance) / 1e18;
    const expectedAmount = parseFloat(escrow.total_amount);

    // Check if balance meets or exceeds expected amount
    const isFunded = balanceInEth >= expectedAmount;

    if (isFunded && escrow.status === "pending") {
      // Get recent transaction to custody wallet for transaction hash
      let txHash = "auto-detected";
      try {
        const blockNumber = await provider.getBlockNumber();
        const startBlock = Math.max(0, blockNumber - 1000); // Check last ~1000 blocks
        
        // Get transaction history (if available via provider)
        // Note: This is simplified - in production, you might use a block explorer API
        txHash = `funded-block-${blockNumber}`;
      } catch (err) {
        console.log("Could not fetch transaction hash:", err);
      }

      // Automatically mark as funded
      const { error: updateError } = await supabase
        .from("escrows")
        .update({
          status: "funded",
          transaction_hash: txHash,
          funded_at: new Date().toISOString(),
        })
        .eq("id", escrowId);

      if (updateError) {
        console.error("Error updating escrow status:", updateError);
        return NextResponse.json(
          { error: "Failed to update escrow status" },
          { status: 500 }
        );
      }

      // Log activity
      await logActivity(
        escrowId,
        "funded",
        escrow.buyer_address,
        `Escrow automatically marked as funded. Balance: ${balanceInEth} ${escrow.currency}`,
        { txHash, autoDetected: true, balance: balanceInEth }
      );

      return NextResponse.json({
        funded: true,
        autoMarked: true,
        balance: balanceInEth,
        expectedAmount,
        txHash,
      });
    }

    return NextResponse.json({
      funded: isFunded,
      balance: balanceInEth,
      expectedAmount,
      shortfall: expectedAmount - balanceInEth,
    });
  } catch (error) {
    console.error("Error checking escrow funding:", error);
    return NextResponse.json(
      { error: "Failed to check funding status" },
      { status: 500 }
    );
  }
}

