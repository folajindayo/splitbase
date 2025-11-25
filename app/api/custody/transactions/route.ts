import { NextRequest } from "next/server";

import { custodyService } from "@/services/custodyService";
import { handleApiError, createApiResponse, ApiError } from "@/middleware/errorHandler";
import { validateRequest } from "@/middleware/validation";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!address) {
      throw new ApiError(400, "Address parameter is required");
    }

    const transactions = await custodyService.getTransactions(address, limit);

    return createApiResponse({
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await validateRequest(request, [
      { field: "from", required: true, type: "string" },
      { field: "to", required: true, type: "string" },
      { field: "amount", required: true, type: "string" },
      { field: "token", required: false, type: "string" },
    ]);

    const { from, to, amount, token } = body;

    const transaction = await custodyService.transfer(from, to, amount, token);

    return createApiResponse(transaction, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

