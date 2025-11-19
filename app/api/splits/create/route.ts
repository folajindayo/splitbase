import { NextRequest } from "next/server";
import { splitService } from "@/services/splitService";
import { handleApiError, createApiResponse, ApiError } from "@/middleware/errorHandler";
import { validateRequest } from "@/middleware/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await validateRequest(request, [
      { field: "owner", required: true, type: "string" },
      { field: "recipients", required: true, type: "object" },
    ]);

    const { owner, recipients } = body;

    // Validate recipients structure
    if (!Array.isArray(recipients)) {
      throw new ApiError(400, "Recipients must be an array");
    }

    if (recipients.length === 0) {
      throw new ApiError(400, "At least one recipient is required");
    }

    // Validate each recipient
    for (const recipient of recipients) {
      if (!recipient.address || typeof recipient.address !== "string") {
        throw new ApiError(400, "Each recipient must have an address");
      }
      if (typeof recipient.percentage !== "number") {
        throw new ApiError(400, "Each recipient must have a percentage");
      }
      if (recipient.percentage <= 0 || recipient.percentage > 100) {
        throw new ApiError(400, "Percentage must be between 0 and 100");
      }
    }

    const split = await splitService.createSplit(owner, recipients);

    return createApiResponse(split, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

