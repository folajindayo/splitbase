"use client";

import { useState } from "react";
import { EscrowMilestone } from "@/lib/escrow";
import { completeMilestone, releaseMilestone } from "@/lib/escrow";

interface MilestoneProgressProps {
  escrowId: string;
  milestones: EscrowMilestone[];
  totalAmount: number;
  currency: string;
  userIsBuyer: boolean;
  userIsSeller: boolean;
  userAddress: string;
  onUpdate: () => void;
}

export default function MilestoneProgress({
  escrowId,
  milestones,
  totalAmount,
  currency,
  userIsBuyer,
  userIsSeller,
  userAddress,
  onUpdate,
}: MilestoneProgressProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'border-gray-300 bg-gray-50';
      case 'completed':
        return 'border-blue-400 bg-blue-50';
      case 'released':
        return 'border-green-400 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">Pending</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs font-medium">Completed</span>;
      case 'released':
        return <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-medium">Released</span>;
      default:
        return null;
    }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!userIsSeller) {
      setError("Only the seller can mark milestones as completed");
      return;
    }

    setLoading(milestoneId);
    setError("");

    try {
      await completeMilestone(milestoneId, userAddress);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete milestone");
    } finally {
      setLoading(null);
    }
  };

  const handleReleaseMilestone = async (milestoneId: string) => {
    if (!userIsBuyer) {
      setError("Only the buyer can release milestone payments");
      return;
    }

    setLoading(milestoneId);
    setError("");

    try {
      await releaseMilestone(milestoneId, userAddress);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to release milestone");
    } finally {
      setLoading(null);
    }
  };

  const releasedAmount = milestones
    .filter((m) => m.status === 'released')
    .reduce((sum, m) => sum + parseFloat(m.amount.toString()), 0);

  const completedCount = milestones.filter((m) => m.status === 'released').length;
  const progressPercentage = (completedCount / milestones.length) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            {completedCount} of {milestones.length} milestones released
          </span>
          <span className="text-sm font-medium">
            {progressPercentage.toFixed(0)}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {releasedAmount.toFixed(4)}
            </div>
            <div className="text-xs text-gray-600">Released ({currency})</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {(totalAmount - releasedAmount).toFixed(4)}
            </div>
            <div className="text-xs text-gray-600">Remaining ({currency})</div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Milestones</h3>
        
        {milestones.map((milestone, index) => (
          <div
            key={milestone.id}
            className={`border-2 rounded-xl p-5 transition-all ${getStatusColor(
              milestone.status
            )}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                  milestone.status === 'released'
                    ? 'bg-green-500 text-white'
                    : milestone.status === 'completed'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-700'
                }`}>
                  {milestone.status === 'released' ? '✓' : index + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(milestone.status)}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {parseFloat(milestone.amount.toString()).toFixed(4)} {currency}
                </div>
                {milestone.completed_at && (
                  <div className="text-xs text-gray-500 mt-1">
                    Completed: {new Date(milestone.completed_at).toLocaleDateString()}
                  </div>
                )}
                {milestone.released_at && (
                  <div className="text-xs text-gray-500 mt-1">
                    Released: {new Date(milestone.released_at).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {milestone.status === 'pending' && userIsSeller && (
                  <button
                    onClick={() => handleCompleteMilestone(milestone.id)}
                    disabled={loading === milestone.id}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {loading === milestone.id ? "Processing..." : "Mark Complete"}
                  </button>
                )}

                {milestone.status === 'completed' && userIsBuyer && (
                  <button
                    onClick={() => handleReleaseMilestone(milestone.id)}
                    disabled={loading === milestone.id}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {loading === milestone.id ? "Releasing..." : "Release Payment"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

