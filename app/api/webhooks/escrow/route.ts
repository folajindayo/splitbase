import { NextRequest } from "next/server";

import { handleApiError, createApiResponse, ApiError } from "@/middleware/errorHandler";

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (in production, verify with actual signature)
    const signature = request.headers.get("x-webhook-signature");

    if (!signature) {
      throw new ApiError(401, "Missing webhook signature");
    }

    const body = await request.json();
    const { event, data } = body;

    // Handle different webhook events
    switch (event) {
      case "escrow.created":
        console.log("Escrow created:", data);
        break;

      case "escrow.funded":
        console.log("Escrow funded:", data);
        break;

      case "escrow.released":
        console.log("Escrow released:", data);
        break;

      case "escrow.refunded":
        console.log("Escrow refunded:", data);
        break;

      case "escrow.disputed":
        console.log("Escrow disputed:", data);
        break;

      default:
        console.log("Unknown event:", event);
    }

    return createApiResponse({ received: true, event });
  } catch (error) {
    return handleApiError(error);
  }
}

