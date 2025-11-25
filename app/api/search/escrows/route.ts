import { NextRequest } from "next/server";

import { escrowService } from "@/services/escrowService";
import { handleApiError, createApiResponse, ApiError } from "@/middleware/errorHandler";
import { searchInObjects } from "@/lib/shared/search";

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

    // Get all escrows for user
    const escrows = await escrowService.getEscrowsByUser(address);

    // Search in escrows
    const results = searchInObjects(escrows, query, {
      fields: ["id", "buyer", "seller", "amount", "status"],
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

