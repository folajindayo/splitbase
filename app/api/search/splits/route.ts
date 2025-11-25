import { NextRequest } from "next/server";

import { handleApiError, createApiResponse, ApiError } from "@/middleware/errorHandler";
import { searchInObjects } from "@/lib/shared/search";
import { splitService } from "@/services/splitService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");
    const query = searchParams.get("q");

    if (!address) {
      throw new ApiError(400, "Address parameter is required");
    }

    if (!query) {
      throw new ApiError(400, "Search query parameter 'q' is required");
    }

    // Get all splits for owner
    const splits = await splitService.getSplitsByOwner(address);

    // Search in splits
    const results = searchInObjects(splits, query, {
      fields: ["id", "owner", "totalDistributed"],
      caseSensitive: false,
    });

    return createApiResponse({
      results,
      count: results.length,
      query,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

