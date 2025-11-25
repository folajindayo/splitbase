import { JsonRpcProvider, parseEther } from "ethers";
import { NextRequest, NextResponse } from "next/server";

import { logActivity } from "@/lib/escrow";
import { sendFundsFromEscrow } from "@/lib/escrowCustody";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { escrowId, milestoneId, releasedBy, chainId } = await req.json();

    if (!escrowId || !milestoneId || !releasedBy) {
      return NextResponse.json(
        { error: "Escrow ID, milestone ID, and releaser address are required" },
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

    // Get milestone
    const { data: milestone, error: milestoneError } = await supabase
      .from("escrow_milestones")
      .select("*")
      .eq("id", milestoneId)
      .eq("escrow_id", escrowId)
      .single();

    if (milestoneError || !milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    // Verify milestone is completed but not released
    if (milestone.status !== "completed") {
      return NextResponse.json(
        { error: "Milestone must be completed before release" },
        { status: 400 }
      );
    }

    if (milestone.status === "released") {
      return NextResponse.json(
        { error: "Milestone already released" },
        { status: 400 }
      );
    }

    // Verify releaser is the buyer
    if (escrow.buyer_address.toLowerCase() !== releasedBy.toLowerCase()) {
      return NextResponse.json(
        { error: "Only the buyer can release milestone funds" },
        { status: 403 }
      );
    }

    // Verify escrow is funded
    if (escrow.status !== "funded") {
      return NextResponse.json(
        { error: "Escrow must be funded before milestone release" },
        { status: 400 }
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

    // Get balance to ensure we have enough
    const balance = await provider.getBalance(escrow.custody_wallet_address);
    
    if (balance === BigInt(0)) {
      return NextResponse.json(
        { error: "Custody wallet has no funds" },
        { status: 400 }
      );
    }

    // Calculate milestone amount in wei
    const milestoneAmountEth = parseFloat(milestone.amount.toString());
    const milestoneAmountWei = parseEther(milestoneAmountEth.toString());

    // Estimate gas for the transaction
    const gasPrice = (await provider.getFeeData()).gasPrice || BigInt(0);
    const estimatedGas = BigInt(21000); // Standard ETH transfer
    const gasCost = gasPrice * estimatedGas;

    // Check if we have enough for milestone + gas
    const totalNeeded = milestoneAmountWei + gasCost;
    
    if (balance < totalNeeded) {
      return NextResponse.json(
        { error: "Insufficient funds in custody wallet for this milestone" },
        { status: 400 }
      );
    }

    // Send milestone amount from custody wallet to seller
    const txHash = await sendFundsFromEscrow(
      escrow.encrypted_private_key,
      escrow.seller_address,
      milestoneAmountWei.toString(),
      provider
    );

    // Update milestone status to released
    const { error: updateMilestoneError } = await supabase
      .from("escrow_milestones")
      .update({
        status: "released",
        released_at: new Date().toISOString(),
      })
      .eq("id", milestoneId);

    if (updateMilestoneError) {
      console.error("Error updating milestone:", updateMilestoneError);
    }

    // Check if all milestones are released
    const { data: allMilestones } = await supabase
      .from("escrow_milestones")
      .select("*")
      .eq("escrow_id", escrowId);

    const allReleased = allMilestones?.every(m => m.status === "released");

    // If all milestones released, update escrow status
    if (allReleased) {
      const { error: updateEscrowError } = await supabase
        .from("escrows")
        .update({
          status: "released",
          released_at: new Date().toISOString(),
        })
        .eq("id", escrowId);

      if (updateEscrowError) {
        console.error("Error updating escrow:", updateEscrowError);
      }

      await logActivity(
        escrowId,
        "completed",
        releasedBy,
        "All milestones released - escrow completed",
        { allMilestones: true }
      );
    }

    // Log milestone release activity
    await logActivity(
      escrowId,
      "milestone_released",
      releasedBy,
      `Milestone "${milestone.title}" released to seller`,
      { 
        milestoneId,
        milestoneTitle: milestone.title,
        amount: milestoneAmountEth,
        txHash 
      }
    );

    return NextResponse.json({
      success: true,
      txHash,
      amountSent: milestoneAmountWei.toString(),
      milestoneTitle: milestone.title,
      allMilestonesReleased: allReleased,
      message: `Milestone "${milestone.title}" successfully released to seller`,
    });
  } catch (error) {
    console.error("Error releasing milestone:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to release milestone" },
      { status: 500 }
    );
  }
}

