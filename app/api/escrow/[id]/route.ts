import { NextRequest } from "next/server";
import { escrowService } from "@/services/escrowService";
import { handleApiError, createApiResponse } from "@/middleware/errorHandler";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const escrow = await escrowService.getEscrow(id);

    if (!escrow) {
      return createApiResponse({ error: "Escrow not found" }, 404);
    }

    return createApiResponse(escrow);
  } catch (error) {
    return handleApiError(error);
  }
}

