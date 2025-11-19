import { NextRequest } from "next/server";
import { handleApiError, createApiResponse } from "@/middleware/errorHandler";

export async function GET(request: NextRequest) {
  try {
    // Mock admin stats - in production, query from database
    const stats = {
      users: {
        total: 5432,
        active: 1234,
        new: 89,
      },
      escrows: {
        total: 856,
        active: 142,
        completed: 698,
        disputed: 8,
        totalVolume: "2,456.78 ETH",
      },
      splits: {
        total: 334,
        active: 289,
        totalDistributed: "8,901.23 ETH",
      },
      custody: {
        walletsManaged: 1234,
        totalBalance: "15,678.90 ETH",
        transactions24h: 456,
      },
      revenue: {
        fees24h: "12.34 ETH",
        feesMonth: "567.89 ETH",
        feesTotal: "1,234.56 ETH",
      },
      lastUpdated: new Date().toISOString(),
    };

    return createApiResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}

