import { NextRequest, NextResponse } from "next/server";
import { getEscrow, updateMilestoneStatus, logActivity } from "@/lib/escrow";
import { releaseFundsFromCustody } from "@/lib/custodialRelease";

/**
 * API Route: Release funds for a specific milestone
 * POST /api/escrow/milestone/release
 * 
 * This endpoint handles releasing funds for individual milestones
 * in milestone-based escrows.
 * 
 * Security:
 * - Verifies milestone is in 'completed' status
 * - Verifies caller is the buyer
 * - Handles blockchain transaction for milestone amount
 * - Updates database after successful release
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, milestoneId, actorAddress } = body;

    // Validate inputs
    if (!escrowId || !milestoneId || !actorAddress) {
      return NextResponse.json(
        { error: "Missing escrowId, milestoneId, or actorAddress" },
        { status: 400 }
      );
    }

    // Get escrow details
    const escrow = await getEscrow(escrowId);
    
    if (!escrow) {
      return NextResponse.json(
        { error: "Escrow not found" },
        { status: 404 }
      );
    }

    // Verify it's a milestone escrow
    if (escrow.escrow_type !== 'milestone') {
      return NextResponse.json(
        { error: "This is not a milestone escrow" },
        { status: 400 }
      );
    }

    // Verify escrow is funded
    if (escrow.status !== 'funded') {
      return NextResponse.json(
        { error: `Cannot release milestone from escrow with status: ${escrow.status}` },
        { status: 400 }
      );
    }

    // Verify caller is the buyer
    if (escrow.buyer_address.toLowerCase() !== actorAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Only the buyer can release milestone funds" },
        { status: 403 }
      );
    }

    // Find the milestone
    const milestone = escrow.milestones.find(m => m.id === milestoneId);
    
    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    // Verify milestone is completed but not yet released
    if (milestone.status !== 'completed') {
      return NextResponse.json(
        { error: `Cannot release milestone with status: ${milestone.status}` },
        { status: 400 }
      );
    }

    // Calculate milestone amount (percentage of total)
    const milestoneAmount = (parseFloat(escrow.total_amount.toString()) * parseFloat(milestone.percentage.toString())) / 100;

    console.log(`Releasing milestone ${milestoneId} (${milestone.percentage}% = ${milestoneAmount} ${escrow.currency})`);
    console.log(`From custodial wallet to seller: ${escrow.seller_address}`);
    
    // Release funds from custodial wallet to seller
    const txHash = await releaseFundsFromCustody(
      escrow.seller_address,
      milestoneAmount.toString(),
      escrow.currency
    );

    console.log(`Milestone funds released successfully. Transaction: ${txHash}`);

    // Update milestone status to released
    await updateMilestoneStatus(
      milestoneId,
      'released',
      actorAddress,
      `Milestone approved. ${milestoneAmount} ${escrow.currency} released to seller. TX: ${txHash}`
    );

    // Log the release activity
    await logActivity(
      escrowId,
      'milestone_released',
      actorAddress,
      `Milestone "${milestone.title}" released. ${milestoneAmount} ${escrow.currency} sent to seller. TX: ${txHash}`
    );

    // Check if all milestones are released
    const allMilestonesReleased = escrow.milestones.every(
      m => m.id === milestoneId || m.status === 'released'
    );

    // If all milestones released, mark escrow as released
    if (allMilestonesReleased) {
      const { updateEscrowStatus } = await import("@/lib/escrow");
      await updateEscrowStatus(
        escrowId,
        'released',
        actorAddress,
        'All milestones completed and released'
      );
      console.log(`All milestones released. Escrow ${escrowId} marked as released.`);
    }

    return NextResponse.json({
      success: true,
      txHash,
      milestoneAmount,
      allMilestonesReleased,
      message: "Milestone funds released successfully",
    });

  } catch (error) {
    console.error("Error releasing milestone funds:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to release milestone funds",
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if milestone release is possible
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const escrowId = searchParams.get('escrowId');
    const milestoneId = searchParams.get('milestoneId');
    const actorAddress = searchParams.get('actorAddress');

    if (!escrowId || !milestoneId || !actorAddress) {
      return NextResponse.json(
        { error: "Missing escrowId, milestoneId, or actorAddress" },
        { status: 400 }
      );
    }

    const escrow = await getEscrow(escrowId);
    
    if (!escrow) {
      return NextResponse.json(
        { error: "Escrow not found" },
        { status: 404 }
      );
    }

    const milestone = escrow.milestones.find(m => m.id === milestoneId);
    
    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    const canRelease = 
      escrow.status === 'funded' &&
      milestone.status === 'completed' &&
      escrow.buyer_address.toLowerCase() === actorAddress.toLowerCase();

    return NextResponse.json({
      canRelease,
      escrowStatus: escrow.status,
      milestoneStatus: milestone.status,
      isBuyer: escrow.buyer_address.toLowerCase() === actorAddress.toLowerCase(),
    });

  } catch (error) {
    console.error("Error checking milestone release status:", error);
    
    return NextResponse.json(
      { error: "Failed to check release status" },
      { status: 500 }
    );
  }
}

