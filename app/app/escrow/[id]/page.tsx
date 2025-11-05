"use client";

import { useState, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useRouter, useParams } from "next/navigation";
import {
  getEscrowById,
  EscrowWithMilestones,
  releaseEscrow,
  cancelEscrow,
  markEscrowAsFunded,
  updateEscrowStatus,
} from "@/lib/escrow";
import MilestoneProgress from "@/components/MilestoneProgress";
import TimeLockCountdown from "@/components/TimeLockCountdown";
import Link from "next/link";
import { exportEscrowToCSV } from "@/lib/escrowExport";
import DisputeModal from "@/components/DisputeModal";
import { openDispute } from "@/lib/escrow";

export default function EscrowDetailsPage() {
  const { address, isConnected } = useAppKitAccount();
  const router = useRouter();
  const params = useParams();
  const escrowId = params.id as string;

  const [escrow, setEscrow] = useState<EscrowWithMilestones | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  useEffect(() => {
    if (escrowId) {
      loadEscrow();
    }
  }, [escrowId]);

  const loadEscrow = async () => {
    setLoading(true);
    try {
      const data = await getEscrowById(escrowId);
      if (!data) {
        setError("Escrow not found");
        return;
      }
      setEscrow(data);
    } catch (err) {
      console.error("Error loading escrow:", err);
      setError("Failed to load escrow");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsFunded = async () => {
    if (!escrow || !address || !txHash) {
      setError("Please provide a transaction hash");
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await markEscrowAsFunded(escrow.id, txHash, address);
      await loadEscrow();
      setTxHash("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as funded");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!escrow || !address) return;

    if (!confirm("Are you sure you want to release the escrow funds to the seller?")) {
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await releaseEscrow(escrow.id, address);
      await loadEscrow();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to release escrow");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!escrow || !address) return;

    if (!confirm("Are you sure you want to cancel this escrow?")) {
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await cancelEscrow(escrow.id, address);
      await loadEscrow();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel escrow");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async (reason: string) => {
    if (!escrow || !address) return;

    await openDispute(escrow.id, address, reason);
    await loadEscrow();
  };

  if (!isConnected || !address) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading escrow...</p>
        </div>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-12 max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Escrow Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "The escrow you're looking for doesn't exist."}</p>
          <Link href="/escrow" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-block shadow-sm hover:shadow transition-all">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const userIsBuyer = escrow.buyer_address.toLowerCase() === address.toLowerCase();
  const userIsSeller = escrow.seller_address.toLowerCase() === address.toLowerCase();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'funded':
        return 'bg-blue-100 text-blue-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/escrow" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <button
              onClick={() => exportEscrowToCSV(escrow)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              📥 Export CSV
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{escrow.title}</h1>
                {escrow.description && (
                  <p className="text-gray-600">{escrow.description}</p>
                )}
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                  escrow.status
                )}`}
              >
                {escrow.status.charAt(0).toUpperCase() + escrow.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Amount Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">💵</span>
              </div>
              <div className="text-sm font-medium text-gray-600">Total Amount</div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {parseFloat(escrow.total_amount.toString()).toFixed(4)}
            </div>
            <div className="text-sm font-medium text-gray-500">{escrow.currency}</div>
          </div>

          {/* Buyer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <div className="text-sm font-medium text-gray-600">
                Buyer {userIsBuyer && <span className="text-blue-600">(You)</span>}
              </div>
            </div>
            <div className="font-mono text-xs text-gray-700 break-all bg-gray-50 p-2 rounded">
              {escrow.buyer_address}
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">🏪</span>
              </div>
              <div className="text-sm font-medium text-gray-600">
                Seller {userIsSeller && <span className="text-green-600">(You)</span>}
              </div>
            </div>
            <div className="font-mono text-xs text-gray-700 break-all bg-gray-50 p-2 rounded">
              {escrow.seller_address}
            </div>
          </div>
        </div>

        {/* Time Lock (if applicable) */}
        {escrow.escrow_type === 'time_locked' && escrow.release_date && (
          <div className="mb-8">
            <TimeLockCountdown
              releaseDate={escrow.release_date}
              autoRelease={escrow.auto_release}
            />
          </div>
        )}

        {/* Milestone Progress (if applicable) */}
        {escrow.escrow_type === 'milestone' && escrow.milestones.length > 0 && (
          <div className="mb-8">
            <MilestoneProgress
              escrowId={escrow.id}
              milestones={escrow.milestones}
              totalAmount={parseFloat(escrow.total_amount.toString())}
              currency={escrow.currency}
              userIsBuyer={userIsBuyer}
              userIsSeller={userIsSeller}
              userAddress={address}
              onUpdate={loadEscrow}
            />
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Actions</h3>

          {/* Pending - Buyer can mark as funded */}
          {escrow.status === 'pending' && userIsBuyer && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="font-medium text-yellow-900 mb-2">⚠️ Waiting for Deposit</div>
                <p className="text-sm text-yellow-700 mb-3">
                  Send {escrow.total_amount} {escrow.currency} to the seller's address, then mark as funded.
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Transaction Hash"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleMarkAsFunded}
                    disabled={actionLoading || !txHash}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow transition-all"
                  >
                    {actionLoading ? "Processing..." : "Mark as Funded"}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisputeModal(true)}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Open Dispute
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel Escrow
                </button>
              </div>
            </div>
          )}

          {/* Funded - Buyer can release (simple and time-locked) */}
          {escrow.status === 'funded' &&
            userIsBuyer &&
            escrow.escrow_type !== 'milestone' && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-3">
                  <div className="font-medium text-green-900 mb-1">✓ Escrow Funded</div>
                  <p className="text-sm text-green-700">
                    Funds have been deposited. Release payment when the seller delivers.
                  </p>
                </div>
                <button
                  onClick={handleRelease}
                  disabled={actionLoading}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow transition-all"
                >
                  {actionLoading ? "Releasing..." : "Release Funds to Seller"}
                </button>
              </div>
            )}

          {/* Released */}
          {escrow.status === 'released' && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="font-medium text-green-900 mb-1">✓ Escrow Completed</div>
              <p className="text-sm text-green-700">
                All funds have been released to the seller.
              </p>
              {escrow.released_at && (
                <p className="text-xs text-green-600 mt-2">
                  Released on {new Date(escrow.released_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Cancelled */}
          {escrow.status === 'cancelled' && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">Escrow Cancelled</div>
              <p className="text-sm text-gray-700">This escrow has been cancelled.</p>
            </div>
          )}

          {/* Disputed */}
          {escrow.status === 'disputed' && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="font-medium text-red-900 mb-1">⚠️ Escrow Under Dispute</div>
              <p className="text-sm text-red-700">
                This escrow has been disputed. Both parties should work towards a resolution.
              </p>
            </div>
          )}

          {/* No actions available */}
          {escrow.status === 'funded' &&
            escrow.escrow_type === 'milestone' && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="font-medium text-blue-900 mb-1">Milestone-Based Escrow</div>
                <p className="text-sm text-blue-700">
                  Use the milestone section above to complete and release milestones.
                </p>
              </div>
            )}

          {escrow.status === 'pending' && !userIsBuyer && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-700">Waiting for buyer to deposit funds...</p>
            </div>
          )}

          {escrow.status === 'funded' && !userIsBuyer && !userIsSeller && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-700">No actions available for your role.</p>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
          
          {escrow.activities.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-4">
              {escrow.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-lg">•</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{activity.message}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      By {activity.actor_address.slice(0, 6)}...{activity.actor_address.slice(-4)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <DisputeModal
          onClose={() => setShowDisputeModal(false)}
          onSubmit={handleDispute}
          escrowTitle={escrow.title}
        />
      )}
    </div>
  );
}

