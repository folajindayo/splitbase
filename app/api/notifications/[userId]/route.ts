import { NextRequest } from "next/server";

import { handleApiError, createApiResponse } from "@/middleware/errorHandler";
import { notificationService } from "@/services/notificationService";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const notifications = await notificationService.getNotifications(userId, limit);

    return createApiResponse({ notifications, count: notifications.length });
  } catch (error) {
    return handleApiError(error);
  }
}

