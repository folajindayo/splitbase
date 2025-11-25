import { JsonRpcProvider } from "ethers";
import { NextRequest, NextResponse } from "next/server";

import { sendFundsFromEscrow } from "@/lib/escrowCustody";
import { supabase } from "@/lib/supabase";
import { updateEscrowStatus, logActivity } from "@/lib/escrow";

export async function POST(req: NextRequest) {
  try {
    const { escrowId, cancelledBy, chainId } = await req.json();

    if (!escrowId || !cancelledBy) {
      return NextResponse.json(
        { error: "Escrow ID and canceller address are required" },
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

    // Verify escrow is funded
    if (escrow.status !== "funded") {
      return NextResponse.json(
        { error: "Escrow must be funded to refund" },
        { status: 400 }
      );
    }

    // Verify canceller is the buyer
    if (escrow.buyer_address.toLowerCase() !== cancelledBy.toLowerCase()) {
      return NextResponse.json(
        { error: "Only the buyer can refund" },
        { status: 403 }
      );
    }

    if (!escrow.encrypted_private_key || !escrow.custody_wallet_address) {
      return NextResponse.json(
        { error: "Custody wallet not properly configured" },
        { status: 500 }
      );
    }

    // Get RPC URL based on chain ID
    const rpcUrl = chainId === 84532
      ? "https://sepolia.base.org"
      : "https://mainnet.base.org";

    const provider = new JsonRpcProvider(rpcUrl);

    // Get balance to ensure we have enough gas
    const balance = await provider.getBalance(escrow.custody_wallet_address);
    
    if (balance === BigInt(0)) {
      return NextResponse.json(
        { error: "Custody wallet has no funds" },
        { status: 400 }
      );
    }

    // Estimate gas for the transaction
    const gasPrice = (await provider.getFeeData()).gasPrice || BigInt(0);
    const estimatedGas = BigInt(21000); // Standard ETH transfer
    const gasCost = gasPrice * estimatedGas;

    // Calculate amount to send (balance minus gas)
    const amountToSend = balance - gasCost;

    if (amountToSend <= BigInt(0)) {
      return NextResponse.json(
        { error: "Insufficient funds to cover gas fees" },
        { status: 400 }
      );
    }

    // Send funds from custody wallet back to buyer
    const txHash = await sendFundsFromEscrow(
      escrow.encrypted_private_key,
      escrow.buyer_address,
      amountToSend.toString(),
      provider
    );

    // Update escrow status to cancelled
    await updateEscrowStatus(escrowId, "cancelled", cancelledBy, "Escrow cancelled - funds refunded to buyer");

    // Update transaction hash
    const { error: updateError } = await supabase
      .from("escrows")
      .update({
        transaction_hash: txHash,
      })
      .eq("id", escrowId);

    if (updateError) {
      console.error("Error updating escrow:", updateError);
    }

    return NextResponse.json({
      success: true,
      txHash,
      amountRefunded: amountToSend.toString(),
      message: "Funds successfully refunded to buyer",
    });
  } catch (error) {
    console.error("Error refunding funds:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to refund funds" },
      { status: 500 }
    );
  }
}

