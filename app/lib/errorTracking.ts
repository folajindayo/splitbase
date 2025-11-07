/**
 * Error Tracking and Logging System for SplitBase
 * Centralized error handling, logging, and reporting
 */

import { supabase } from "./supabase";
import { logCustodyAudit } from "./custodyAudit";

export interface ErrorLog {
  id?: string;
  error_type: "api" | "custody" | "database" | "network" | "validation" | "unknown";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack_trace?: string;
  user_address?: string;
  escrow_id?: string;
  endpoint?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface ErrorSummary {
  totalErrors: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  recentErrors: ErrorLog[];
  unresolvedCount: number;
}

/**
 * Log an error to the database
 */
export async function logError(
  error: Omit<ErrorLog, "id" | "timestamp" | "resolved">
): Promise<string | null> {
  try {
    const { data, error: dbError } = await supabase
      .from("error_logs")
      .insert({
        ...error,
        resolved: false,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error logging error to database:", dbError);
      return null;
    }

    // Log to console for immediate visibility
    console.error(`[${error.severity.toUpperCase()}] ${error.error_type}:`, error.message);

    // If it's a custody error, also log to custody audit
    if (error.error_type === "custody" && error.escrow_id) {
      await logCustodyAudit({
        escrow_id: error.escrow_id,
        action_type: "funds_released", // Use closest match
        actor_address: error.user_address || "system",
        custody_address: "",
        metadata: {
          error: true,
          error_message: error.message,
          severity: error.severity,
        },
      });
    }

    return data.id;
  } catch (err) {
    console.error("Failed to log error:", err);
    return null;
  }
}

/**
 * Log API error
 */
export async function logApiError(
  endpoint: string,
  error: Error,
  userAddress?: string,
  severity: "low" | "medium" | "high" | "critical" = "medium"
): Promise<void> {
  await logError({
    error_type: "api",
    severity,
    message: error.message,
    stack_trace: error.stack,
    user_address: userAddress,
    endpoint,
    metadata: {
      name: error.name,
    },
  });
}

/**
 * Log custody error
 */
export async function logCustodyError(
  escrowId: string,
  error: Error,
  userAddress?: string,
  severity: "low" | "medium" | "high" | "critical" = "high"
): Promise<void> {
  await logError({
    error_type: "custody",
    severity,
    message: error.message,
    stack_trace: error.stack,
    user_address: userAddress,
    escrow_id: escrowId,
    metadata: {
      name: error.name,
    },
  });
}

/**
 * Log database error
 */
export async function logDatabaseError(
  error: Error,
  query?: string,
  severity: "low" | "medium" | "high" | "critical" = "high"
): Promise<void> {
  await logError({
    error_type: "database",
    severity,
    message: error.message,
    stack_trace: error.stack,
    metadata: {
      query,
      name: error.name,
    },
  });
}

/**
 * Log network error
 */
export async function logNetworkError(
  endpoint: string,
  error: Error,
  severity: "low" | "medium" | "high" | "critical" = "medium"
): Promise<void> {
  await logError({
    error_type: "network",
    severity,
    message: error.message,
    stack_trace: error.stack,
    endpoint,
    metadata: {
      name: error.name,
    },
  });
}

/**
 * Log validation error
 */
export async function logValidationError(
  message: string,
  field?: string,
  value?: unknown,
  userAddress?: string
): Promise<void> {
  await logError({
    error_type: "validation",
    severity: "low",
    message,
    user_address: userAddress,
    metadata: {
      field,
      value,
    },
  });
}

/**
 * Get error summary
 */
export async function getErrorSummary(
  timeRange: "1h" | "24h" | "7d" | "30d" = "24h"
): Promise<ErrorSummary> {
  try {
    const now = new Date();
    let startTime = new Date();

    switch (timeRange) {
      case "1h":
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const { data: errors, error: dbError } = await supabase
      .from("error_logs")
      .select("*")
      .gte("timestamp", startTime.toISOString())
      .order("timestamp", { ascending: false });

    if (dbError || !errors) {
      return {
        totalErrors: 0,
        byType: {},
        bySeverity: {},
        recentErrors: [],
        unresolvedCount: 0,
      };
    }

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let unresolvedCount = 0;

    errors.forEach((e) => {
      byType[e.error_type] = (byType[e.error_type] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
      if (!e.resolved) unresolvedCount++;
    });

    return {
      totalErrors: errors.length,
      byType,
      bySeverity,
      recentErrors: errors.slice(0, 10) as ErrorLog[],
      unresolvedCount,
    };
  } catch (err) {
    console.error("Error in getErrorSummary:", err);
    return {
      totalErrors: 0,
      byType: {},
      bySeverity: {},
      recentErrors: [],
      unresolvedCount: 0,
    };
  }
}

/**
 * Get critical errors (unresolved, high/critical severity)
 */
export async function getCriticalErrors(limit: number = 10): Promise<ErrorLog[]> {
  try {
    const { data, error } = await supabase
      .from("error_logs")
      .select("*")
      .eq("resolved", false)
      .in("severity", ["high", "critical"])
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data as ErrorLog[];
  } catch (err) {
    console.error("Error in getCriticalErrors:", err);
    return [];
  }
}

/**
 * Mark error as resolved
 */
export async function markErrorResolved(
  errorId: string,
  resolvedBy?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("error_logs")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
      })
      .eq("id", errorId);

    if (error) {
      console.error("Error marking error as resolved:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error in markErrorResolved:", err);
    return false;
  }
}

/**
 * Clean up old resolved errors
 */
export async function cleanupOldErrors(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from("error_logs")
      .delete()
      .eq("resolved", true)
      .lt("timestamp", cutoffDate.toISOString())
      .select();

    if (error) {
      console.error("Error cleaning up old errors:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error("Error in cleanupOldErrors:", err);
    return 0;
  }
}

/**
 * Get errors by type
 */
export async function getErrorsByType(
  errorType: ErrorLog["error_type"],
  limit: number = 20
): Promise<ErrorLog[]> {
  try {
    const { data, error } = await supabase
      .from("error_logs")
      .select("*")
      .eq("error_type", errorType)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data as ErrorLog[];
  } catch (err) {
    console.error("Error in getErrorsByType:", err);
    return [];
  }
}

/**
 * Get error trends (count by day)
 */
export async function getErrorTrends(
  days: number = 7
): Promise<{ date: string; count: number; critical: number }[]> {
  try {
    const now = new Date();
    const trends: { date: string; count: number; critical: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const { data } = await supabase
        .from("error_logs")
        .select("severity")
        .gte("timestamp", dateStr)
        .lt("timestamp", nextDay);

      const count = data?.length || 0;
      const critical = data?.filter((e) => e.severity === "critical").length || 0;

      trends.push({ date: dateStr, count, critical });
    }

    return trends;
  } catch (err) {
    console.error("Error in getErrorTrends:", err);
    return [];
  }
}

/**
 * Safe wrapper for async functions with automatic error logging
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context: {
    errorType: ErrorLog["error_type"];
    severity?: ErrorLog["severity"];
    endpoint?: string;
    userAddress?: string;
    escrowId?: string;
  }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    await logError({
      error_type: context.errorType,
      severity: context.severity || "medium",
      message: error instanceof Error ? error.message : String(error),
      stack_trace: error instanceof Error ? error.stack : undefined,
      user_address: context.userAddress,
      escrow_id: context.escrowId,
      endpoint: context.endpoint,
    });
    throw error;
  }
}

