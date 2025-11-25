import { NextRequest } from "next/server";

import { dataExporter } from "@/lib/export";
import { handleApiError, ApiError } from "@/middleware/errorHandler";
import { splitService } from "@/services/splitService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");
    const format = (searchParams.get("format") || "json") as "json" | "csv";

    if (!address) {
      throw new ApiError(400, "Address parameter is required");
    }

    // Get splits for owner
    const splits = await splitService.getSplitsByOwner(address);

    // Export data
    const exportData = dataExporter.exportSplits(splits, {
      format,
      prettify: format === "json",
    });

    const fileName = dataExporter.generateFileName("splits", format);

    const contentType = format === "csv" ? "text/csv" : "application/json";

    return new Response(exportData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

