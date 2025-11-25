import { NextResponse } from "next/server";

import { performCustodyHealthCheck, generateHealthCheckReport } from "@/lib/custodyHealthCheck";

export async function GET() {
  try {
    const healthCheck = await performCustodyHealthCheck();

    // Return appropriate HTTP status based on health
    const statusCode = 
      healthCheck.status === "healthy" ? 200 :
      healthCheck.status === "warning" ? 200 :
      503; // Service Unavailable for critical

    return NextResponse.json(healthCheck, { status: statusCode });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "critical",
        error: "Health check failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

export async function POST() {
  try {
    const healthCheck = await performCustodyHealthCheck();
    const report = generateHealthCheckReport(healthCheck);

    return new NextResponse(report, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="custody-health-${Date.now()}.txt"`,
      },
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      { error: "Failed to generate health report" },
      { status: 500 }
    );
  }
}

