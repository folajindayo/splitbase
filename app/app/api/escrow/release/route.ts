import { NextRequest, NextResponse } from "next/server";
import { getEscrow, updateEscrowStatus, logActivity } from "@/lib/escrow";
import { releaseFundsFromCustody } from "@/lib/custodialRelease";

/**
 * API Route: Release funds from custodial escrow
 * POST /api/escrow/release
 * 
 * This endpoint handles the actual blockchain transaction to release funds
 * from the custodial wallet to the seller.
 * 
 * Security:
 * - Verifies escrow is in 'funded' status
 * - Verifies caller is the buyer
 * - Handles blockchain transaction
 * - Updates database after successful release
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, actorAddress } = body;

    // Validate inputs
    if (!escrowId || !actorAddress) {
      return NextResponse.json(
        { error: "Missing escrowId or actorAddress" },
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

    // Verify escrow is funded
    if (escrow.status !== 'funded') {
      return NextResponse.json(
        { error: `Cannot release escrow with status: ${escrow.status}` },
        { status: 400 }
      );
    }

    // Verify caller is the buyer (only buyer can release)
    if (escrow.buyer_address.toLowerCase() !== actorAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Only the buyer can release funds" },
        { status: 403 }
      );
    }

    // Release funds from custodial wallet to seller
    console.log(`Releasing ${escrow.total_amount} ${escrow.currency} from escrow ${escrowId}`);
    console.log(`From custodial wallet to seller: ${escrow.seller_address}`);
    
    const txHash = await releaseFundsFromCustody(
      escrow.seller_address,
      escrow.total_amount.toString(),
      escrow.currency
    );

    console.log(`Funds released successfully. Transaction: ${txHash}`);

    // Update escrow status to released
    await updateEscrowStatus(
      escrowId,
      'released',
      actorAddress,
      `Funds released to seller. Transaction: ${txHash}`
    );

    // Log the release activity
    await logActivity(
      escrowId,
      'escrow_released',
      actorAddress,
      `Buyer approved release. ${escrow.total_amount} ${escrow.currency} sent to seller. TX: ${txHash}`
    );

    return NextResponse.json({
      success: true,
      txHash,
      message: "Funds released successfully",
    });

  } catch (error) {
    console.error("Error releasing escrow funds:", error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to release funds",
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if release is possible
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const escrowId = searchParams.get('escrowId');
    const actorAddress = searchParams.get('actorAddress');

    if (!escrowId || !actorAddress) {
      return NextResponse.json(
        { error: "Missing escrowId or actorAddress" },
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

    const canRelease = 
      escrow.status === 'funded' &&
      escrow.buyer_address.toLowerCase() === actorAddress.toLowerCase();

    return NextResponse.json({
      canRelease,
      escrowStatus: escrow.status,
      isBuyer: escrow.buyer_address.toLowerCase() === actorAddress.toLowerCase(),
    });

  } catch (error) {
    console.error("Error checking release status:", error);
    
    return NextResponse.json(
      { error: "Failed to check release status" },
      { status: 500 }
    );
  }
}

