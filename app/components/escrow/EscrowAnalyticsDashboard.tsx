"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AnalyticsData {
  totalEscrows: number;
  totalValue: number;
  avgEscrowValue: number;
  completionRate: number;
  avgCompletionTime: number; // in days
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  recentTrends: {
    date: string;
    created: number;
    funded: number;
    released: number;
  }[];
}

export default function EscrowAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date(0); // Beginning of time
      
      if (timeRange === "7d") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === "30d") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (timeRange === "90d") {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      // Fetch all escrows in range
      const { data: escrows, error } = await supabase
        .from("escrows")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      if (!escrows) {
        setAnalytics(null);
        return;
      }

      // Calculate analytics
      const totalEscrows = escrows.length;
      const totalValue = escrows.reduce((sum, e) => sum + e.total_amount, 0);
      const avgEscrowValue = totalEscrows > 0 ? totalValue / totalEscrows : 0;

      // Status breakdown
      const byStatus: Record<string, number> = {};
      escrows.forEach((e) => {
        byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      });

      // Type breakdown
      const byType: Record<string, number> = {};
      escrows.forEach((e) => {
        byType[e.escrow_type] = (byType[e.escrow_type] || 0) + 1;
      });

      // Completion rate
      const completedCount = byStatus.released || 0;
      const completionRate = totalEscrows > 0 ? (completedCount / totalEscrows) * 100 : 0;

      // Average completion time (for released escrows)
      const completedEscrows = escrows.filter((e) => e.status === "released" && e.released_at);
      let avgCompletionTime = 0;
      
      if (completedEscrows.length > 0) {
        const totalDays = completedEscrows.reduce((sum, e) => {
          const created = new Date(e.created_at).getTime();
          const released = new Date(e.released_at!).getTime();
          const days = (released - created) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);
        avgCompletionTime = totalDays / completedEscrows.length;
      }

      // Recent trends (last 7 days)
      const trends: { date: string; created: number; funded: number; released: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        
        const created = escrows.filter(
          (e) => e.created_at.split("T")[0] === dateStr
        ).length;
        
        const funded = escrows.filter(
          (e) => e.funded_at && e.funded_at.split("T")[0] === dateStr
        ).length;
        
        const released = escrows.filter(
          (e) => e.released_at && e.released_at.split("T")[0] === dateStr
        ).length;
        
        trends.push({ date: dateStr, created, funded, released });
      }

      setAnalytics({
        totalEscrows,
        totalValue,
        avgEscrowValue,
        completionRate,
        avgCompletionTime,
        byStatus,
        byType,
        recentTrends: trends,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Escrow Analytics</h2>
        <div className="flex gap-2">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium ${
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {range === "all" ? "All Time" : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Escrows</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalEscrows}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Value</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.totalValue.toFixed(2)} ETH
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.completionRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg. Completion</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.avgCompletionTime.toFixed(1)}d
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏱️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">By Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(analytics.byStatus).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600 capitalize">{status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">By Type</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(analytics.byType).map(([type, count]) => (
            <div key={type} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-600 capitalize">
                {type.replace("_", " ")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trends */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">7-Day Trend</h3>
        <div className="space-y-3">
          {analytics.recentTrends.map((trend) => (
            <div key={trend.date} className="flex items-center gap-4">
              <div className="w-24 text-sm text-gray-600">
                {new Date(trend.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-medium">Created:</span>
                  <span className="text-gray-900">{trend.created}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-medium">Funded:</span>
                  <span className="text-gray-900">{trend.funded}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-600 font-medium">Released:</span>
                  <span className="text-gray-900">{trend.released}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

