import { NextResponse } from "next/server";
import { handleApiError, createApiResponse } from "@/middleware/errorHandler";

export async function GET() {
  try {
    // Mock stats - in real app, query from database or blockchain
    const stats = {
      total: 156,
      active: 42,
      completed: 98,
      disputed: 5,
      cancelled: 11,
      totalVolume: "1234.56 ETH",
      averageAmount: "7.91 ETH",
      lastUpdated: new Date().toISOString(),
    };

    return createApiResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

