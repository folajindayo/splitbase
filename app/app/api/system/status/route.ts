import { NextRequest, NextResponse } from "next/server";

import { getErrorSummary } from "@/lib/errorTracking";
import { getNotificationStats } from "@/lib/custodyNotifications";
import { getRetryStatistics } from "@/lib/custodyRetry";
import { getSystemStats } from "@/lib/performanceMonitor";
import { performHealthCheck } from "@/lib/custodyHealthCheck";

/**
 * GET /api/system/status
 * Public system status endpoint
 * Shows overall system health and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Run all health checks and get statistics in parallel
    const [
      healthCheck,
      performanceStats,
      errorSummary,
      retryStats,
      notificationStats,
    ] = await Promise.all([
      performHealthCheck(),
      getSystemStats("1h").catch(() => ({
        totalRequests: 0,
        avgDuration: 0,
        errorRate: 0,
        slowestEndpoints: [],
        mostUsedEndpoints: [],
      })),
      getErrorSummary("1h").catch(() => ({
        totalErrors: 0,
        byType: {},
        bySeverity: {},
        recentErrors: [],
        unresolvedCount: 0,
      })),
      getRetryStatistics().catch(() => ({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0,
      })),
      getNotificationStats().catch(() => ({
        total: 0,
        unread: 0,
        bySeverity: {},
        byType: {},
      })),
    ]);

    // Determine overall system status
    let overallStatus: "operational" | "degraded" | "down" = "operational";
    const issues: string[] = [];

    // Check health
    if (!healthCheck.database) {
      overallStatus = "down";
      issues.push("Database connection failed");
    }

    if (!healthCheck.encryption) {
      overallStatus = "down";
      issues.push("Encryption system unavailable");
    }

    if (!healthCheck.rpcConnection) {
      overallStatus = "degraded";
      issues.push("RPC connection issues");
    }

    // Check error rate
    if (performanceStats.errorRate > 10) {
      overallStatus = overallStatus === "down" ? "down" : "degraded";
      issues.push(`High error rate: ${performanceStats.errorRate.toFixed(1)}%`);
    }

    // Check unresolved errors
    if (errorSummary.unresolvedCount > 10) {
      overallStatus = overallStatus === "down" ? "down" : "degraded";
      issues.push(`${errorSummary.unresolvedCount} unresolved errors`);
    }

    // Check retry failures
    if (retryStats.failed > retryStats.completed * 0.2 && retryStats.total > 0) {
      overallStatus = overallStatus === "down" ? "down" : "degraded";
      issues.push("High retry failure rate");
    }

    // Build response
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      uptime: process.uptime ? `${Math.floor(process.uptime())}s` : "unknown",
      issues: issues.length > 0 ? issues : undefined,
      
      components: {
        database: {
          status: healthCheck.database ? "operational" : "down",
          message: healthCheck.database ? "Connected" : "Connection failed",
        },
        encryption: {
          status: healthCheck.encryption ? "operational" : "down",
          message: healthCheck.encryption ? "Available" : "Unavailable",
        },
        rpcNode: {
          status: healthCheck.rpcConnection ? "operational" : "degraded",
          message: healthCheck.rpcConnection ? "Connected" : "Connection issues",
        },
        custodySystem: {
          status: healthCheck.custodyWallets ? "operational" : "degraded",
          wallets: healthCheck.details?.totalWallets || 0,
          walletsWithBalance: healthCheck.details?.walletsWithBalance || 0,
          totalValue: healthCheck.details?.totalValueInCustody || "0",
        },
      },

      metrics: {
        performance: {
          requests1h: performanceStats.totalRequests,
          avgResponseTime: `${performanceStats.avgDuration.toFixed(0)}ms`,
          errorRate: `${performanceStats.errorRate.toFixed(1)}%`,
        },
        errors: {
          total1h: errorSummary.totalErrors,
          unresolved: errorSummary.unresolvedCount,
          bySeverity: errorSummary.bySeverity,
        },
        retries: {
          pending: retryStats.pending,
          completed: retryStats.completed,
          failed: retryStats.failed,
        },
        notifications: {
          unread: notificationStats.unread,
          total: notificationStats.total,
        },
      },
    };

    // Set appropriate HTTP status code
    let statusCode = 200;
    if (overallStatus === "degraded") statusCode = 200; // Still return 200 for degraded
    if (overallStatus === "down") statusCode = 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error("Error in system status endpoint:", error);
    
    return NextResponse.json(
      {
        status: "down",
        timestamp: new Date().toISOString(),
        message: "System status check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

/**
 * HEAD /api/system/status
 * Simple health check - returns 200 if system is up
 */
export async function HEAD() {
  try {
    // Quick health check
    const health = await performHealthCheck();
    
    if (health.database && health.encryption) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 503 });
    }
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}

