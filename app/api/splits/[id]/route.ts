import { NextRequest } from "next/server";
import { splitService } from "@/services/splitService";
import { handleApiError, createApiResponse } from "@/middleware/errorHandler";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const split = await splitService.getSplit(id);

    if (!split) {
      return createApiResponse({ error: "Split not found" }, 404);
    }

    return createApiResponse(split);
  } catch (error) {
    return handleApiError(error);
  }
}

