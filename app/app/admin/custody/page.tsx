"use client";

import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import CustodyStatsAdmin from "@/components/CustodyStatsAdmin";
import { createCustodyBackup, exportBackupToJSON, getBackupSummary } from "@/lib/custodyBackup";
import { performCustodyHealthCheck, generateHealthCheckReport } from "@/lib/custodyHealthCheck";

export default function AdminCustodyPage() {
  const { address, isConnected } = useAppKitAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Simple admin check (in production, use proper authentication)
  const isAdmin = isConnected; // Replace with real admin check

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">Please connect your wallet to access the custody admin panel.</p>
          <button
            onClick={() => router.push("/")}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const handleCreateBackup = async () => {
    setLoading(true);
    setMessage("");
    try {
      const backup = await createCustodyBackup();
      exportBackupToJSON(backup);
      setMessage("✅ Backup created and downloaded successfully");
    } catch (err) {
      setMessage(`❌ Error: ${err instanceof Error ? err.message : "Failed to create backup"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    setLoading(true);
    setMessage("");
    try {
      const health = await performCustodyHealthCheck();
      const report = generateHealthCheckReport(health);
      
      // Download as text file
      const blob = new Blob([report], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `health-check-${Date.now()}.txt`;
      link.click();
      
      setMessage(`Health Status: ${health.status.toUpperCase()}`);
    } catch (err) {
      setMessage(`❌ Error: ${err instanceof Error ? err.message : "Health check failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBackupSummary = async () => {
    setLoading(true);
    setMessage("");
    try {
      const summary = await getBackupSummary();
      setMessage(
        `📊 Backup Summary:\n` +
        `• Escrows: ${summary.totalEscrows}\n` +
        `• Audit Logs: ${summary.totalAuditLogs}\n` +
        `• Est. Size: ${summary.estimatedBackupSize}\n` +
        `• Date Range: ${summary.oldestEscrow ? new Date(summary.oldestEscrow).toLocaleDateString() : 'N/A'} - ${summary.newestEscrow ? new Date(summary.newestEscrow).toLocaleDateString() : 'N/A'}`
      );
    } catch (err) {
      setMessage(`❌ Error: ${err instanceof Error ? err.message : "Failed to get summary"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Custody Admin Panel</h1>
              <p className="text-purple-100">Monitor and manage the custody system</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-purple-100 mb-1">Admin Address</div>
              <div className="font-mono text-xs bg-white/20 px-3 py-1 rounded">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleCreateBackup}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              <span>💾</span>
              <span>{loading ? "Creating..." : "Create Backup"}</span>
            </button>

            <button
              onClick={handleHealthCheck}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              <span>🏥</span>
              <span>{loading ? "Checking..." : "Health Check"}</span>
            </button>

            <button
              onClick={handleViewBackupSummary}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              <span>📊</span>
              <span>{loading ? "Loading..." : "Backup Summary"}</span>
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.startsWith("❌") 
                ? "bg-red-50 border border-red-200 text-red-800"
                : message.startsWith("✅")
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
              <pre className="whitespace-pre-wrap text-sm font-mono">{message}</pre>
            </div>
          )}
        </div>

        {/* Statistics Dashboard */}
        <CustodyStatsAdmin />

        {/* Additional Admin Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">System Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-semibold">2.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="font-semibold">{process.env.NODE_ENV || "development"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-semibold">Base Sepolia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Check:</span>
                <span className="font-semibold">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a
                href="/api/escrow/health"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm transition-colors"
              >
                📡 Health Check API
              </a>
              <a
                href="/api/escrow/custody-stats"
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm transition-colors"
              >
                📊 Statistics API
              </a>
              <button
                onClick={() => router.push("/escrow")}
                className="w-full text-left px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm transition-colors"
              >
                🔒 Escrow Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

