/**
 * Escrow Search and Filter Utilities
 * Advanced search, filtering, and sorting capabilities
 */

import type { Escrow } from "./escrow";

export type SortField = "created_at" | "total_amount" | "status" | "updated_at";
export type SortOrder = "asc" | "desc";

export interface SearchFilters {
  query?: string;
  status?: Escrow["status"] | "all";
  escrowType?: Escrow["escrow_type"] | "all";
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  role?: "buyer" | "seller" | "all";
  userAddress?: string;
}

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

/**
 * Search escrows by text query
 */
export function searchEscrows(escrows: Escrow[], query: string): Escrow[] {
  if (!query || query.trim() === "") {
    return escrows;
  }

  const lowerQuery = query.toLowerCase().trim();

  return escrows.filter((escrow) => {
    // Search in title
    if (escrow.title?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in description
    if (escrow.description?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in ID
    if (escrow.id.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    // Search in addresses
    if (
      escrow.buyer_address.toLowerCase().includes(lowerQuery) ||
      escrow.seller_address.toLowerCase().includes(lowerQuery)
    ) {
      return true;
    }

    // Search in deposit address
    if (escrow.deposit_address?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    return false;
  });
}

/**
 * Filter escrows by criteria
 */
export function filterEscrows(
  escrows: Escrow[],
  filters: SearchFilters
): Escrow[] {
  let filtered = [...escrows];

  // Filter by text query
  if (filters.query) {
    filtered = searchEscrows(filtered, filters.query);
  }

  // Filter by status
  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter((e) => e.status === filters.status);
  }

  // Filter by escrow type
  if (filters.escrowType && filters.escrowType !== "all") {
    filtered = filtered.filter((e) => e.escrow_type === filters.escrowType);
  }

  // Filter by amount range
  if (filters.minAmount !== undefined) {
    filtered = filtered.filter((e) => e.total_amount >= filters.minAmount!);
  }
  if (filters.maxAmount !== undefined) {
    filtered = filtered.filter((e) => e.total_amount <= filters.maxAmount!);
  }

  // Filter by date range
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filtered = filtered.filter(
      (e) => new Date(e.created_at) >= fromDate
    );
  }
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    filtered = filtered.filter(
      (e) => new Date(e.created_at) <= toDate
    );
  }

  // Filter by user role
  if (filters.role && filters.role !== "all" && filters.userAddress) {
    const userAddr = filters.userAddress.toLowerCase();
    if (filters.role === "buyer") {
      filtered = filtered.filter((e) => e.buyer_address === userAddr);
    } else if (filters.role === "seller") {
      filtered = filtered.filter((e) => e.seller_address === userAddr);
    }
  }

  return filtered;
}

/**
 * Sort escrows
 */
export function sortEscrows(
  escrows: Escrow[],
  options: SortOptions
): Escrow[] {
  const sorted = [...escrows];

  sorted.sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (options.field) {
      case "created_at":
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case "updated_at":
        aValue = new Date(a.updated_at).getTime();
        bValue = new Date(b.updated_at).getTime();
        break;
      case "total_amount":
        aValue = a.total_amount;
        bValue = b.total_amount;
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = 0;
        bValue = 0;
    }

    if (aValue < bValue) {
      return options.order === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return options.order === "asc" ? 1 : -1;
    }
    return 0;
  });

  return sorted;
}

/**
 * Get suggested searches based on escrows
 */
export function getSuggestedSearches(escrows: Escrow[]): string[] {
  const suggestions: string[] = [];

  // Most common amounts
  const amounts = escrows.map((e) => e.total_amount);
  if (amounts.length > 0) {
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    suggestions.push(`Amount > ${avgAmount.toFixed(2)} ETH`);
  }

  // Active disputes
  const disputes = escrows.filter((e) => e.status === "disputed").length;
  if (disputes > 0) {
    suggestions.push(`Disputed (${disputes})`);
  }

  // Pending for long time
  const longPending = escrows.filter((e) => {
    if (e.status !== "pending") return false;
    const days = Math.floor(
      (Date.now() - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days > 7;
  }).length;
  if (longPending > 0) {
    suggestions.push(`Pending >7 days (${longPending})`);
  }

  // Large amounts
  const largeAmount = escrows.filter((e) => e.total_amount > 5).length;
  if (largeAmount > 0) {
    suggestions.push(`Large amounts (${largeAmount})`);
  }

  return suggestions.slice(0, 5);
}

/**
 * Group escrows by criteria
 */
export function groupEscrows(
  escrows: Escrow[],
  groupBy: "status" | "type" | "month"
): Record<string, Escrow[]> {
  const groups: Record<string, Escrow[]> = {};

  escrows.forEach((escrow) => {
    let key: string;

    switch (groupBy) {
      case "status":
        key = escrow.status;
        break;
      case "type":
        key = escrow.escrow_type;
        break;
      case "month":
        const date = new Date(escrow.created_at);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      default:
        key = "other";
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(escrow);
  });

  return groups;
}

/**
 * Calculate search statistics
 */
export function calculateSearchStats(escrows: Escrow[]): {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  totalValue: number;
  avgValue: number;
} {
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let totalValue = 0;

  escrows.forEach((escrow) => {
    // Count by status
    byStatus[escrow.status] = (byStatus[escrow.status] || 0) + 1;

    // Count by type
    byType[escrow.escrow_type] = (byType[escrow.escrow_type] || 0) + 1;

    // Sum value
    totalValue += escrow.total_amount;
  });

  return {
    total: escrows.length,
    byStatus,
    byType,
    totalValue,
    avgValue: escrows.length > 0 ? totalValue / escrows.length : 0,
  };
}

/**
 * Quick filter presets
 */
export const filterPresets: Record<string, SearchFilters> = {
  myActiveBuyer: {
    role: "buyer",
    status: "funded",
  },
  myActiveSeller: {
    role: "seller",
    status: "funded",
  },
  needsAction: {
    status: "pending",
  },
  disputed: {
    status: "disputed",
  },
  completed: {
    status: "released",
  },
  largeAmount: {
    minAmount: 5,
  },
  recentWeek: {
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  recentMonth: {
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

/**
 * Highlight search query in text
 */
export function highlightText(text: string, query: string): string {
  if (!query || !text) return text;

  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

/**
 * Validate search filters
 */
export function validateFilters(filters: SearchFilters): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (
    filters.minAmount !== undefined &&
    filters.maxAmount !== undefined &&
    filters.minAmount > filters.maxAmount
  ) {
    errors.push("Minimum amount cannot be greater than maximum amount");
  }

  if (
    filters.dateFrom &&
    filters.dateTo &&
    new Date(filters.dateFrom) > new Date(filters.dateTo)
  ) {
    errors.push("Start date cannot be after end date");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

