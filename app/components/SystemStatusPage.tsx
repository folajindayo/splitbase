"use client";

import { useEffect, useState } from "react";

interface SystemStatus {
  status: "operational" | "degraded" | "down";
  timestamp: string;
  version: string;
  uptime: string;
  issues?: string[];
  components: {
    database: { status: string; message: string };
    encryption: { status: string; message: string };
    rpcNode: { status: string; message: string };
    custodySystem: {
      status: string;
      wallets: number;
      walletsWithBalance: number;
      totalValue: string;
    };
  };
  metrics: {
    performance: {
      requests1h: number;
      avgResponseTime: string;
      errorRate: string;
    };
    errors: {
      total1h: number;
      unresolved: number;
      bySeverity: Record<string, number>;
    };
    retries: {
      pending: number;
      completed: number;
      failed: number;
    };
    notifications: {
      unread: number;
      total: number;
    };
  };
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/system/status");
      const data = await response.json();
      setStatus(data);
      setLastUpdate(new Date());
      setError("");
    } catch (err) {
      setError("Failed to load system status");
      console.error("Error loading status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // Refresh every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "operational":
        return "All Systems Operational";
      case "degraded":
        return "Degraded Performance";
      case "down":
        return "System Down";
      default:
        return "Unknown Status";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system status...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Unable to Load Status
          </h2>
          <p className="text-gray-600 mb-4">{error || "Unknown error occurred"}</p>
          <button
            onClick={loadStatus}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
            <button
              onClick={loadStatus}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(status.status)}`}></div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {getStatusText(status.status)}
              </p>
              <p className="text-sm text-gray-600">
                Last updated: {lastUpdate?.toLocaleTimeString()}
              </p>
            </div>
          </div>

          {status.issues && status.issues.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-semibold text-yellow-800 mb-2">⚠️ Current Issues:</p>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                {status.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>Version: {status.version}</div>
            <div>Uptime: {status.uptime}</div>
          </div>
        </div>

        {/* Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Database</h3>
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(
                  status.components.database.status
                )}`}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{status.components.database.message}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Encryption</h3>
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(
                  status.components.encryption.status
                )}`}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{status.components.encryption.message}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">RPC Node</h3>
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(
                  status.components.rpcNode.status
                )}`}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{status.components.rpcNode.message}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Custody System</h3>
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(
                  status.components.custodySystem.status
                )}`}
              ></div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Wallets: {status.components.custodySystem.wallets}</p>
              <p>Active: {status.components.custodySystem.walletsWithBalance}</p>
              <p>Total Value: {status.components.custodySystem.totalValue} ETH</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">System Metrics (Last Hour)</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">API Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {status.metrics.performance.requests1h}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {status.metrics.performance.avgResponseTime}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Error Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {status.metrics.performance.errorRate}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Unresolved Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {status.metrics.errors.unresolved}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Retries</p>
                <p className="text-xl font-semibold text-gray-900">
                  {status.metrics.retries.pending}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Retries</p>
                <p className="text-xl font-semibold text-gray-900">
                  {status.metrics.retries.completed}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Unread Notifications</p>
                <p className="text-xl font-semibold text-gray-900">
                  {status.metrics.notifications.unread}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>SplitBase Custodial Escrow Platform</p>
          <p>Monitoring powered by real-time health checks</p>
        </div>
      </div>
    </div>
  );
}

