import { NextRequest } from "next/server";

import { escrowService } from "@/services/escrowService";
import { handleApiError, createApiResponse, ApiError } from "@/middleware/errorHandler";
import { validateRequest } from "@/middleware/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await validateRequest(request, [
      { field: "buyer", required: true, type: "string" },
      { field: "seller", required: true, type: "string" },
      { field: "amount", required: true, type: "string" },
    ]);

    const { buyer, seller, amount } = body;

    // Validate addresses (basic check)
    if (!buyer.startsWith("0x") || !seller.startsWith("0x")) {
      throw new ApiError(400, "Invalid address format");
    }

    const escrow = await escrowService.createEscrow(buyer, seller, amount);

    return createApiResponse(escrow, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

