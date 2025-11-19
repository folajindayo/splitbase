import { NextRequest } from "next/server";
import { escrowService } from "@/services/escrowService";
import { dataExporter } from "@/lib/export";
import { handleApiError, ApiError } from "@/middleware/errorHandler";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");
    const format = (searchParams.get("format") || "json") as "json" | "csv";

    if (!address) {
      throw new ApiError(400, "Address parameter is required");
    }

    // Get escrows for user
    const escrows = await escrowService.getEscrowsByUser(address);

    // Export data
    const exportData = dataExporter.exportEscrows(escrows, {
      format,
      prettify: format === "json",
    });

    const fileName = dataExporter.generateFileName("escrows", format);

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

