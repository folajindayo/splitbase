import { NextRequest, NextResponse } from "next/server";
import {
  processRetryableTransactions,
  getRetryStatistics,
  cleanupOldRetryableTransactions,
} from "@/lib/custodyRetry";
import { applyRateLimit } from "@/lib/custodyRateLimit";

/**
 * POST /api/escrow/process-retries
 * Process pending retryable transactions
 * Should be called by cron job or scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Apply rate limiting
    const rateLimit = await applyRateLimit(ip, "process-retries");
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { 
          status: 429,
          headers: rateLimit.headers,
        }
      );
    }

    // Verify authorization (you might want to add a secret token check)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, require it for authorization
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Process retryable transactions
    const result = await processRetryableTransactions();

    // Get updated statistics
    const stats = await getRetryStatistics();

    return NextResponse.json({
      success: true,
      result: {
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
      },
      statistics: stats,
      timestamp: new Date().toISOString(),
    }, {
      headers: rateLimit.headers,
    });
  } catch (error) {
    console.error("Error processing retries:", error);
    return NextResponse.json(
      {
        error: "Failed to process retries",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/escrow/process-retries
 * Get retry statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Apply rate limiting
    const rateLimit = await applyRateLimit(ip, "process-retries");
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { 
          status: 429,
          headers: rateLimit.headers,
        }
      );
    }

    // Get statistics
    const stats = await getRetryStatistics();

    return NextResponse.json({
      statistics: stats,
      timestamp: new Date().toISOString(),
    }, {
      headers: rateLimit.headers,
    });
  } catch (error) {
    console.error("Error getting retry statistics:", error);
    return NextResponse.json(
      {
        error: "Failed to get retry statistics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/escrow/process-retries
 * Cleanup old completed/failed retry transactions
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Apply rate limiting
    const rateLimit = await applyRateLimit(ip, "process-retries");
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { 
          status: 429,
          headers: rateLimit.headers,
        }
      );
    }

    // Verify authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get days parameter from query string
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "30");

    // Cleanup old transactions
    const deletedCount = await cleanupOldRetryableTransactions(days);

    return NextResponse.json({
      success: true,
      deletedCount,
      daysOld: days,
      timestamp: new Date().toISOString(),
    }, {
      headers: rateLimit.headers,
    });
  } catch (error) {
    console.error("Error cleaning up retry transactions:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup retry transactions",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

