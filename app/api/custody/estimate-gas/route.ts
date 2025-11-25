import { NextRequest } from "next/server";

import { custodyService } from "@/services/custodyService";
import { handleApiError, createApiResponse, ApiError } from "@/middleware/errorHandler";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, amount, token } = body;

    if (!to || !amount) {
      throw new ApiError(400, "To address and amount are required");
    }

    const gasEstimate = await custodyService.estimateGas(to, amount, token);

    return createApiResponse({
      gasEstimate,
      to,
      amount,
      token: token || "native",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

