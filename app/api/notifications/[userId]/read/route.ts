import { NextRequest } from "next/server";
import { notificationService } from "@/services/notificationService";
import { handleApiError, createApiResponse } from "@/middleware/errorHandler";
import { validateRequest } from "@/middleware/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const body = await validateRequest(request, [
      { field: "notificationId", required: false, type: "string" },
      { field: "all", required: false, type: "boolean" },
    ]);

    if (body.all) {
      const count = await notificationService.markAllAsRead(userId);
      return createApiResponse({ success: true, marked: count });
    } else if (body.notificationId) {
      const success = await notificationService.markAsRead(body.notificationId);
      return createApiResponse({ success });
    } else {
      return createApiResponse(
        { error: "Provide either notificationId or set all to true" },
        400
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

