import { NextRequest } from "next/server";

import { escrowService } from "@/services/escrowService";
import { handleApiError, createApiResponse } from "@/middleware/errorHandler";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const success = await escrowService.refundEscrow(id);

    return createApiResponse({ success, message: "Escrow refunded successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

