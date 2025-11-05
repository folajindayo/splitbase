import { NextRequest, NextResponse } from "next/server";
import { BrowserProvider, JsonRpcProvider } from "ethers";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, chainId } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Get RPC URL based on chain ID
    const rpcUrl = chainId === 84532
      ? "https://sepolia.base.org"
      : "https://mainnet.base.org";

    const provider = new JsonRpcProvider(rpcUrl);
    const balance = await provider.getBalance(walletAddress);

    return NextResponse.json({
      balance: balance.toString(),
      balanceInEth: (Number(balance) / 1e18).toString(),
      address: walletAddress,
    });
  } catch (error) {
    console.error("Error checking balance:", error);
    return NextResponse.json(
      { error: "Failed to check balance" },
      { status: 500 }
    );
  }
}

