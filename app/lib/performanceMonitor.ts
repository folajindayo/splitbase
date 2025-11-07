/**
 * Performance Monitoring for SplitBase Custody System
 * Track and analyze API performance, response times, and system health
 */

import { supabase } from "./supabase";

export interface PerformanceMetric {
  id?: string;
  endpoint: string;
  method: string;
  duration_ms: number;
  status_code: number;
  user_address?: string;
  error_message?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceStats {
  endpoint: string;
  totalRequests: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  errorRate: number;
  p50: number;
  p95: number;
  p99: number;
}

// In-memory buffer for performance metrics (flush periodically to DB)
const metricsBuffer: PerformanceMetric[] = [];
const BUFFER_FLUSH_SIZE = 50;
const BUFFER_FLUSH_INTERVAL = 30000; // 30 seconds

/**
 * Record a performance metric
 */
export async function recordPerformanceMetric(
  metric: Omit<PerformanceMetric, "id" | "timestamp">
): Promise<void> {
  const fullMetric: PerformanceMetric = {
    ...metric,
    timestamp: new Date().toISOString(),
  };

  metricsBuffer.push(fullMetric);

  // Flush if buffer is full
  if (metricsBuffer.length >= BUFFER_FLUSH_SIZE) {
    await flushMetricsBuffer();
  }
}

/**
 * Flush metrics buffer to database
 */
export async function flushMetricsBuffer(): Promise<void> {
  if (metricsBuffer.length === 0) return;

  const metricsToFlush = [...metricsBuffer];
  metricsBuffer.length = 0; // Clear buffer

  try {
    const { error } = await supabase
      .from("performance_metrics")
      .insert(metricsToFlush);

    if (error) {
      console.error("Error flushing performance metrics:", error);
      // Put metrics back in buffer if insert failed
      metricsBuffer.unshift(...metricsToFlush);
    }
  } catch (err) {
    console.error("Error in flushMetricsBuffer:", err);
    metricsBuffer.unshift(...metricsToFlush);
  }
}

/**
 * Measure execution time of a function
 */
export async function measurePerformance<T>(
  endpoint: string,
  method: string,
  fn: () => Promise<T>,
  userAddress?: string
): Promise<T> {
  const startTime = performance.now();
  let statusCode = 200;
  let errorMessage: string | undefined;

  try {
    const result = await fn();
    return result;
  } catch (error) {
    statusCode = 500;
    errorMessage = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    const duration = performance.now() - startTime;

    await recordPerformanceMetric({
      endpoint,
      method,
      duration_ms: duration,
      status_code: statusCode,
      user_address: userAddress,
      error_message: errorMessage,
    });
  }
}

/**
 * Get performance statistics for an endpoint
 */
export async function getEndpointStats(
  endpoint: string,
  timeRange: "1h" | "24h" | "7d" | "30d" = "24h"
): Promise<PerformanceStats | null> {
  try {
    // Calculate start time based on range
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

    const { data, error } = await supabase
      .from("performance_metrics")
      .select("*")
      .eq("endpoint", endpoint)
      .gte("timestamp", startTime.toISOString())
      .order("duration_ms", { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    // Calculate statistics
    const durations = data.map((m) => m.duration_ms);
    const totalRequests = data.length;
    const avgDuration = durations.reduce((a, b) => a + b, 0) / totalRequests;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const errorCount = data.filter((m) => m.status_code >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    // Calculate percentiles
    const p50Index = Math.floor(totalRequests * 0.5);
    const p95Index = Math.floor(totalRequests * 0.95);
    const p99Index = Math.floor(totalRequests * 0.99);

    return {
      endpoint,
      totalRequests,
      avgDuration,
      minDuration,
      maxDuration,
      errorRate,
      p50: durations[p50Index],
      p95: durations[p95Index],
      p99: durations[p99Index],
    };
  } catch (err) {
    console.error("Error in getEndpointStats:", err);
    return null;
  }
}

/**
 * Get overall system performance statistics
 */
export async function getSystemStats(
  timeRange: "1h" | "24h" | "7d" | "30d" = "24h"
): Promise<{
  totalRequests: number;
  avgDuration: number;
  errorRate: number;
  slowestEndpoints: { endpoint: string; avgDuration: number }[];
  mostUsedEndpoints: { endpoint: string; requestCount: number }[];
}> {
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

    const { data, error } = await supabase
      .from("performance_metrics")
      .select("*")
      .gte("timestamp", startTime.toISOString());

    if (error || !data) {
      return {
        totalRequests: 0,
        avgDuration: 0,
        errorRate: 0,
        slowestEndpoints: [],
        mostUsedEndpoints: [],
      };
    }

    const totalRequests = data.length;
    const avgDuration =
      data.reduce((sum, m) => sum + m.duration_ms, 0) / totalRequests;
    const errorCount = data.filter((m) => m.status_code >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    // Group by endpoint
    const endpointStats: Record<
      string,
      { durations: number[]; count: number }
    > = {};
    data.forEach((m) => {
      if (!endpointStats[m.endpoint]) {
        endpointStats[m.endpoint] = { durations: [], count: 0 };
      }
      endpointStats[m.endpoint].durations.push(m.duration_ms);
      endpointStats[m.endpoint].count++;
    });

    // Calculate slowest endpoints
    const slowestEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration:
          stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    // Calculate most used endpoints
    const mostUsedEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        requestCount: stats.count,
      }))
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, 5);

    return {
      totalRequests,
      avgDuration,
      errorRate,
      slowestEndpoints,
      mostUsedEndpoints,
    };
  } catch (err) {
    console.error("Error in getSystemStats:", err);
    return {
      totalRequests: 0,
      avgDuration: 0,
      errorRate: 0,
      slowestEndpoints: [],
      mostUsedEndpoints: [],
    };
  }
}

/**
 * Clean up old performance metrics
 */
export async function cleanupOldMetrics(daysOld: number = 7): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from("performance_metrics")
      .delete()
      .lt("timestamp", cutoffDate.toISOString())
      .select();

    if (error) {
      console.error("Error cleaning up old metrics:", error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error("Error in cleanupOldMetrics:", err);
    return 0;
  }
}

/**
 * Get slow request details (requests taking longer than threshold)
 */
export async function getSlowRequests(
  thresholdMs: number = 2000,
  limit: number = 10
): Promise<PerformanceMetric[]> {
  try {
    const { data, error } = await supabase
      .from("performance_metrics")
      .select("*")
      .gte("duration_ms", thresholdMs)
      .order("duration_ms", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data as PerformanceMetric[];
  } catch (err) {
    console.error("Error in getSlowRequests:", err);
    return [];
  }
}

/**
 * Get error requests
 */
export async function getErrorRequests(limit: number = 10): Promise<PerformanceMetric[]> {
  try {
    const { data, error } = await supabase
      .from("performance_metrics")
      .select("*")
      .gte("status_code", 400)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data as PerformanceMetric[];
  } catch (err) {
    console.error("Error in getErrorRequests:", err);
    return [];
  }
}

// Auto-flush metrics buffer periodically
if (typeof window === "undefined") {
  setInterval(() => {
    flushMetricsBuffer().catch((err) =>
      console.error("Error in auto-flush:", err)
    );
  }, BUFFER_FLUSH_INTERVAL);
}

