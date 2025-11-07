"use client";

import { useState } from "react";
import { filterPresets, type SearchFilters } from "@/lib/escrowSearch";

interface AdvancedFilterPanelProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
  userAddress?: string;
}

export default function AdvancedFilterPanel({
  onFiltersChange,
  initialFilters = {},
  userAddress,
}: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const applyPreset = (presetName: string) => {
    const preset = { ...filterPresets[presetName] };
    if (userAddress && (preset.role === "buyer" || preset.role === "seller")) {
      preset.userAddress = userAddress;
    }
    setFilters(preset);
    onFiltersChange(preset);
  };

  const clearFilters = () => {
    const emptyFilters: SearchFilters = {
      query: "",
      status: "all",
      escrowType: "all",
      role: "all",
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status && filters.status !== "all") count++;
    if (filters.escrowType && filters.escrowType !== "all") count++;
    if (filters.minAmount !== undefined) count++;
    if (filters.maxAmount !== undefined) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.role && filters.role !== "all") count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
            <p className="text-sm text-gray-600">
              {activeCount > 0 ? `${activeCount} filter${activeCount !== 1 ? "s" : ""} active` : "No filters applied"}
            </p>
          </div>
        </div>
        <span className="text-gray-500">{isOpen ? "▼" : "▶"}</span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-200 p-4 space-y-6">
          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Filters
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => applyPreset("needsAction")}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                📋 Needs Action
              </button>
              <button
                onClick={() => applyPreset("disputed")}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                ⚠️ Disputed
              </button>
              <button
                onClick={() => applyPreset("largeAmount")}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                💎 Large Amount
              </button>
              <button
                onClick={() => applyPreset("recentWeek")}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                📅 Recent
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status || "all"}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="funded">Funded</option>
              <option value="released">Released</option>
              <option value="disputed">Disputed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Escrow Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escrow Type
            </label>
            <select
              value={filters.escrowType || "all"}
              onChange={(e) => handleFilterChange("escrowType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="simple">Simple</option>
              <option value="time_locked">Time Locked</option>
              <option value="milestone">Milestone</option>
            </select>
          </div>

          {/* Role Filter */}
          {userAddress && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                My Role
              </label>
              <select
                value={filters.role || "all"}
                onChange={(e) => {
                  handleFilterChange("role", e.target.value);
                  if (e.target.value !== "all") {
                    handleFilterChange("userAddress", userAddress);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="buyer">As Buyer</option>
                <option value="seller">As Seller</option>
              </select>
            </div>
          )}

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Range (ETH)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Min"
                value={filters.minAmount || ""}
                onChange={(e) =>
                  handleFilterChange("minAmount", e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Max"
                value={filters.maxAmount || ""}
                onChange={(e) =>
                  handleFilterChange("maxAmount", e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateFrom?.split("T")[0] || ""}
                  onChange={(e) =>
                    handleFilterChange("dateFrom", e.target.value ? new Date(e.target.value).toISOString() : undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateTo?.split("T")[0] || ""}
                  onChange={(e) =>
                    handleFilterChange("dateTo", e.target.value ? new Date(e.target.value).toISOString() : undefined)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Apply Filters
            </button>
          </div>

          {/* Active Filters Summary */}
          {activeCount > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {filters.status && filters.status !== "all" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    Status: {filters.status}
                  </span>
                )}
                {filters.escrowType && filters.escrowType !== "all" && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    Type: {filters.escrowType}
                  </span>
                )}
                {filters.minAmount !== undefined && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Min: {filters.minAmount} ETH
                  </span>
                )}
                {filters.maxAmount !== undefined && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Max: {filters.maxAmount} ETH
                  </span>
                )}
                {filters.role && filters.role !== "all" && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    Role: {filters.role}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

