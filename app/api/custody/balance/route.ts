import { NextRequest } from "next/server";
import { handleApiError, createApiResponse, ApiError } from "@/middleware/errorHandler";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
      throw new ApiError(400, "Address parameter is required");
    }

    // Mock balance - in real app, query blockchain
    const balance = {
      address,
      native: "12.34 ETH",
      tokens: [
        {
          symbol: "USDC",
          balance: "1000.00",
          address: "0x...",
        },
        {
          symbol: "DAI",
          balance: "500.50",
          address: "0x...",
        },
      ],
      totalValueUSD: "15234.56",
      lastUpdated: new Date().toISOString(),
    };

    return createApiResponse(balance);
  } catch (error) {
    return handleApiError(error);
  }
}

