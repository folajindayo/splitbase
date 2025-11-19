"use client";

import { EscrowWithMilestones } from "@/lib/escrow";

interface EscrowQuickStatsProps {
  escrows: EscrowWithMilestones[];
  userAddress: string;
}

export default function EscrowQuickStats({ escrows, userAddress }: EscrowQuickStatsProps) {
  const lowerAddress = userAddress.toLowerCase();

  // Calculate statistics
  const pendingActions = escrows.filter(e => {
    const isBuyer = e.buyer_address.toLowerCase() === lowerAddress;
    const isSeller = e.seller_address.toLowerCase() === lowerAddress;
    
    // Buyer pending: funded escrows waiting for release
    if (isBuyer && e.status === 'funded' && e.escrow_type !== 'milestone') {
      return true;
    }
    
    // Buyer pending: completed milestones waiting for release
    if (isBuyer && e.escrow_type === 'milestone') {
      const completedMilestones = e.milestones?.filter(m => m.status === 'completed') || [];
      if (completedMilestones.length > 0) return true;
    }
    
    // Seller pending: pending escrows waiting for funding
    if (isSeller && e.status === 'pending') {
      return true;
    }
    
    return false;
  }).length;

  const awaitingFunding = escrows.filter(e => 
    e.status === 'pending' && e.buyer_address.toLowerCase() === lowerAddress
  ).length;

  const awaitingDelivery = escrows.filter(e => 
    e.status === 'funded' && e.buyer_address.toLowerCase() === lowerAddress
  ).length;

  const disputed = escrows.filter(e => e.status === 'disputed').length;

  // Calculate total value in escrows (as buyer)
  const totalValueAsBuyer = escrows
    .filter(e => e.buyer_address.toLowerCase() === lowerAddress)
    .reduce((sum, e) => sum + parseFloat(e.total_amount.toString()), 0);

  const totalValueAsSeller = escrows
    .filter(e => e.seller_address.toLowerCase() === lowerAddress)
    .reduce((sum, e) => sum + parseFloat(e.total_amount.toString()), 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pending Actions */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚡</span>
            <span className="text-sm font-medium text-orange-700">Action Required</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{pendingActions}</div>
          <div className="text-xs text-orange-600 mt-1">Tasks awaiting you</div>
        </div>

        {/* Awaiting Funding */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💳</span>
            <span className="text-sm font-medium text-yellow-700">Awaiting Funding</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900">{awaitingFunding}</div>
          <div className="text-xs text-yellow-600 mt-1">Need your deposit</div>
        </div>

        {/* Awaiting Delivery */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📦</span>
            <span className="text-sm font-medium text-blue-700">In Progress</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{awaitingDelivery}</div>
          <div className="text-xs text-blue-600 mt-1">Awaiting delivery</div>
        </div>

        {/* Disputed */}
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚠️</span>
            <span className="text-sm font-medium text-red-700">Disputed</span>
          </div>
          <div className="text-2xl font-bold text-red-900">{disputed}</div>
          <div className="text-xs text-red-600 mt-1">Need resolution</div>
        </div>
      </div>

      {/* Total Value Summary */}
      {(totalValueAsBuyer > 0 || totalValueAsSeller > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {totalValueAsBuyer > 0 && (
              <div>
                <span className="text-gray-600">Total as Buyer:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {totalValueAsBuyer.toFixed(4)} ETH
                </span>
              </div>
            )}
            {totalValueAsSeller > 0 && (
              <div>
                <span className="text-gray-600">Total as Seller:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {totalValueAsSeller.toFixed(4)} ETH
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

