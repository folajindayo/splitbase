import { NextRequest, NextResponse } from "next/server";
import { BrowserProvider, JsonRpcProvider } from "ethers";
import { getPoolDetails, getEventWinners } from "@/lib/contracts";

/**
 * GET /api/prize-pool?poolId=X
 * Get details for a specific prize pool
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const poolId = searchParams.get("poolId");
    const chainId = searchParams.get("chainId") || "8453"; // Default to Base mainnet

    if (!poolId) {
      return NextResponse.json(
        { error: "Missing poolId parameter" },
        { status: 400 }
      );
    }

    // Get RPC URL based on chain
    const rpcUrl =
      chainId === "84532"
        ? process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"
        : process.env.BASE_RPC_URL || "https://mainnet.base.org";

    const provider = new JsonRpcProvider(rpcUrl);

    // Fetch pool details
    const details = await getPoolDetails(
      provider as any,
      parseInt(poolId)
    );

    return NextResponse.json({
      success: true,
      pool: {
        eventId: details.eventId.toString(),
        host: details.host,
        totalAmount: details.totalAmount.toString(),
        remainingAmount: details.remainingAmount.toString(),
        tokenAddress: details.tokenAddress,
        status: details.status,
        requiredSignatures: details.requiredSignatures.toString(),
      },
    });
  } catch (error: any) {
    console.error("Prize pool API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch prize pool details" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prize-pool
 * Get winners for a specific event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, chainId = "8453" } = body;

    if (eventId === undefined) {
      return NextResponse.json(
        { error: "Missing eventId parameter" },
        { status: 400 }
      );
    }

    // Get RPC URL based on chain
    const rpcUrl =
      chainId === "84532"
        ? process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"
        : process.env.BASE_RPC_URL || "https://mainnet.base.org";

    const provider = new JsonRpcProvider(rpcUrl);

    // Fetch event winners
    const winners = await getEventWinners(
      provider as any,
      parseInt(eventId)
    );

    return NextResponse.json({
      success: true,
      winners: winners.map((winner) => ({
        recipient: winner.recipient,
        amount: winner.amount.toString(),
        rank: winner.rank.toString(),
        projectName: winner.projectName,
        paidAt: winner.paidAt.toString(),
      })),
    });
  } catch (error: any) {
    console.error("Prize pool API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch event winners" },
      { status: 500 }
    );
  }
}


