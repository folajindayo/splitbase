"use client";

import { useState, useEffect } from "react";
import {
  calculateEscrowCosts,
  calculateMilestones,
  validateMilestonePercentages,
  formatETH,
  formatUSD,
  type MilestoneBreakdown,
} from "@/lib/escrowCalculator";

export default function EscrowCalculatorWidget() {
  const [amount, setAmount] = useState("1.0");
  const [escrowType, setEscrowType] = useState<"simple" | "milestone">("simple");
  const [milestones, setMilestones] = useState([
    { title: "Milestone 1", percentage: 50 },
    { title: "Milestone 2", percentage: 50 },
  ]);
  const [ethPrice, setEthPrice] = useState(3000);
  const [showDetails, setShowDetails] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const costs = calculateEscrowCosts(numAmount);
  const milestoneBreakdown =
    escrowType === "milestone"
      ? calculateMilestones(numAmount, milestones)
      : [];
  const milestoneValidation = validateMilestonePercentages(milestones);

  const addMilestone = () => {
    if (milestones.length < 10) {
      setMilestones([...milestones, { title: `Milestone ${milestones.length + 1}`, percentage: 0 }]);
    }
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 2) {
      setMilestones(milestones.filter((_, i) => i !== index));
    }
  };

  const updateMilestone = (
    index: number,
    field: "title" | "percentage",
    value: string | number
  ) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Escrow Calculator
        </h2>
        <p className="text-gray-600">
          Calculate costs and breakdown for your escrow
        </p>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Escrow Amount (ETH)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
          placeholder="1.0"
        />
        <p className="text-sm text-gray-500 mt-1">
          ≈ {formatUSD(numAmount, ethPrice)}
        </p>
      </div>

      {/* Escrow Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Escrow Type
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setEscrowType("simple")}
            className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
              escrowType === "simple"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setEscrowType("milestone")}
            className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
              escrowType === "milestone"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            Milestone
          </button>
        </div>
      </div>

      {/* Milestones Configuration */}
      {escrowType === "milestone" && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Milestones
            </label>
            <button
              onClick={addMilestone}
              disabled={milestones.length >= 10}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
            >
              + Add Milestone
            </button>
          </div>

          {milestones.map((milestone, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={milestone.title}
                  onChange={(e) =>
                    updateMilestone(index, "title", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Milestone title"
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={milestone.percentage}
                  onChange={(e) =>
                    updateMilestone(index, "percentage", parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  placeholder="%"
                />
              </div>
              {milestones.length > 2 && (
                <button
                  onClick={() => removeMilestone(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {!milestoneValidation.valid && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {milestoneValidation.error}
            </div>
          )}
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 mb-4">Cost Breakdown</h3>

        <div className="space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Escrow Amount</span>
            <span className="font-medium">{formatETH(costs.amount)}</span>
          </div>

          <div className="flex justify-between text-gray-700">
            <span>Platform Fee</span>
            <span className="font-medium text-green-600">
              {formatETH(costs.platformFee)} (Free Beta!)
            </span>
          </div>

          <div className="flex justify-between text-gray-700">
            <span>Estimated Gas Fee</span>
            <span className="font-medium">{formatETH(costs.gasFee)}</span>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between text-lg font-semibold text-gray-900">
              <span>Total Deposit</span>
              <span>{formatETH(costs.totalDeposit)}</span>
            </div>
            <p className="text-sm text-gray-500 text-right mt-1">
              ≈ {formatUSD(costs.totalDeposit, ethPrice)}
            </p>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between text-gray-700">
              <span>Seller Receives</span>
              <span className="font-medium text-blue-600">
                {formatETH(costs.sellerReceives)}
              </span>
            </div>
          </div>
        </div>

        {/* Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-4"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
            <p>
              • Platform fee is currently waived during beta period
            </p>
            <p>
              • Gas fees cover blockchain transaction costs
            </p>
            <p>
              • Estimated gas based on current Base network conditions
            </p>
            {escrowType === "milestone" && (
              <p>
                • Each milestone release incurs a separate gas fee
              </p>
            )}
          </div>
        )}
      </div>

      {/* Milestone Breakdown */}
      {escrowType === "milestone" &&
        milestoneValidation.valid &&
        milestoneBreakdown.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Milestone Breakdown
            </h3>
            <div className="space-y-3">
              {milestoneBreakdown.map((m) => (
                <div
                  key={m.milestoneNumber}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {m.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {m.percentage}% of total
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatETH(m.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ≈ {formatUSD(m.amount, ethPrice)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Cumulative: {formatETH(m.cumulativeAmount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

