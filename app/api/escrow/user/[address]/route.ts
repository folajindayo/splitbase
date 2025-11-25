import { NextRequest } from "next/server";

import { escrowService } from "@/services/escrowService";
import { handleApiError, createApiResponse } from "@/middleware/errorHandler";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const escrows = await escrowService.getEscrowsByUser(address);

    return createApiResponse(escrows);
  } catch (error) {
    return handleApiError(error);
  }
}

