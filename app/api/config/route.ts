import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Only expose non-sensitive config to the client
    const config = {
      chainId: process.env.NEXT_PUBLIC_CHAIN_ID,
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
      environment: process.env.NODE_ENV,
      features: {
        custody: process.env.NEXT_PUBLIC_CUSTODY_ENABLED === "true",
        escrow: process.env.NEXT_PUBLIC_ESCROW_ENABLED === "true",
        splits: process.env.NEXT_PUBLIC_SPLITS_ENABLED === "true",
      },
    };

    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch config" },
      { status: 500 }
    );
  }
}

