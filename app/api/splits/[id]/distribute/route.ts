import { NextRequest } from "next/server";

import { handleApiError, createApiResponse, ApiError } from "@/middleware/errorHandler";
import { splitService } from "@/services/splitService";
import { validateRequest } from "@/middleware/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const body = await validateRequest(request, [
      { field: "amount", required: true, type: "string" },
    ]);

    const { amount } = body;

    const success = await splitService.distributeFunds(id, amount);

    return createApiResponse({
      success,
      message: `Distributed ${amount} to split recipients`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

