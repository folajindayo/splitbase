import { NextRequest } from "next/server";

import { handleApiError, createApiResponse, ApiError } from "@/middleware/errorHandler";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-webhook-signature");

    if (!signature) {
      throw new ApiError(401, "Missing webhook signature");
    }

    const body = await request.json();
    const { event, data } = body;

    // Handle different webhook events
    switch (event) {
      case "split.created":
        console.log("Split created:", data);
        break;

      case "split.updated":
        console.log("Split updated:", data);
        break;

      case "split.distributed":
        console.log("Funds distributed:", data);
        break;

      case "split.deactivated":
        console.log("Split deactivated:", data);
        break;

      default:
        console.log("Unknown event:", event);
    }

    return createApiResponse({ received: true, event });
  } catch (error) {
    return handleApiError(error);
  }
}

