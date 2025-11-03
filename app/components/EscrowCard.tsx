"use client";

import Link from "next/link";
import { EscrowWithMilestones } from "@/lib/escrow";

interface EscrowCardProps {
  escrow: EscrowWithMilestones;
  userAddress: string;
}

export default function EscrowCard({ escrow, userAddress }: EscrowCardProps) {
  const isBuyer = escrow.buyer_address.toLowerCase() === userAddress.toLowerCase();
  const isSeller = escrow.seller_address.toLowerCase() === userAddress.toLowerCase();
  
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'simple':
        return 'Simple';
      case 'time_locked':
        return 'Time-Locked';
      case 'milestone':
        return 'Milestone';
      default:
        return type;
    }
  };

  const calculateMilestoneProgress = () => {
    if (escrow.escrow_type !== 'milestone' || !escrow.milestones.length) {
      return 0;
    }
    const released = escrow.milestones.filter((m) => m.status === 'released').length;
    return Math.round((released / escrow.milestones.length) * 100);
  };

  const milestoneProgress = calculateMilestoneProgress();

  return (
    <Link href={`/escrow/${escrow.id}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {escrow.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {escrow.description || "No description provided"}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              escrow.status
            )}`}
          >
            {escrow.status.charAt(0).toUpperCase() + escrow.status.slice(1)}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="text-lg font-bold text-gray-900">
              {parseFloat(escrow.total_amount.toString()).toFixed(4)} {escrow.currency}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Type:</span>
            <span className="text-sm font-medium text-gray-700">
              {getTypeLabel(escrow.escrow_type)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Your Role:</span>
            <span className="text-sm font-medium text-gray-700">
              {isBuyer ? "Buyer" : isSeller ? "Seller" : "Observer"}
            </span>
          </div>

          {escrow.escrow_type === 'milestone' && escrow.milestones.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Progress:</span>
                <span className="text-sm font-medium text-gray-700">
                  {milestoneProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${milestoneProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <div className="font-medium">Buyer</div>
            <div className="font-mono truncate">
              {escrow.buyer_address.slice(0, 6)}...{escrow.buyer_address.slice(-4)}
            </div>
          </div>
          <div>
            <div className="font-medium">Seller</div>
            <div className="font-mono truncate">
              {escrow.seller_address.slice(0, 6)}...{escrow.seller_address.slice(-4)}
            </div>
          </div>
        </div>

        {escrow.release_date && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Release Date: {new Date(escrow.release_date).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

