import { NextResponse } from "next/server";

export async function GET() {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
        },
        uptime: process.uptime(),
      },
      nodejs: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

