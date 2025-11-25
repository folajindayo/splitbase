import { NextRequest } from "next/server";

import { handleApiError, createApiResponse } from "@/middleware/errorHandler";
import { splitService } from "@/services/splitService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const success = await splitService.deactivateSplit(id);

    return createApiResponse({
      success,
      message: "Split deactivated successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

