import { NextRequest } from "next/server";

import { createApiResponse, handleApiError } from "@/middleware/errorHandler";
import { logger } from "@/middleware/logging";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const logs = logger.getLogs(Math.min(limit, 1000));

    return createApiResponse({
      logs,
      count: logs.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    logger.clear();

    return createApiResponse({ message: "Logs cleared successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}

