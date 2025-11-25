import { NextResponse } from "next/server";

import { handleApiError, createApiResponse } from "@/middleware/errorHandler";

export async function GET() {
  try {
    // Mock stats - in real app, query from database or blockchain
    const stats = {
      total: 234,
      active: 189,
      inactive: 45,
      totalDistributed: "5678.90 ETH",
      averageRecipients: 4.2,
      largestSplit: {
        id: "split-123",
        amount: "456.78 ETH",
        recipients: 12,
      },
      lastUpdated: new Date().toISOString(),
    };

    return createApiResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

