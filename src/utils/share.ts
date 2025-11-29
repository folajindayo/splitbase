/**
 * Share Calculation Utilities
 * Functions for calculating and distributing shares
 */

export interface ShareAllocation {
  id: string;
  percentage: number;
  amount: number;
}

export interface DistributionResult {
  allocations: ShareAllocation[];
  totalDistributed: number;
  remainder: number;
  isValid: boolean;
}

/**
 * Calculate amounts from percentages
 */
export function calculateAmountsFromPercentages(
  totalAmount: number,
  percentages: number[],
  precision: number = 6
): number[] {
  const multiplier = Math.pow(10, precision);
  
  return percentages.map(pct => {
    const amount = (totalAmount * pct) / 100;
    return Math.round(amount * multiplier) / multiplier;
  });
}

/**
 * Calculate percentages from amounts
 */
export function calculatePercentagesFromAmounts(
  totalAmount: number,
  amounts: number[]
): number[] {
  if (totalAmount === 0) return amounts.map(() => 0);
  
  return amounts.map(amount => {
    const percentage = (amount / totalAmount) * 100;
    return Math.round(percentage * 100) / 100;
  });
}

/**
 * Distribute total equally among recipients
 */
export function distributeEqually(
  totalAmount: number,
  count: number,
  precision: number = 6
): { percentage: number; amount: number }[] {
  if (count === 0) return [];
  
  const basePercentage = Math.floor((100 / count) * 100) / 100;
  const baseAmount = totalAmount / count;
  const multiplier = Math.pow(10, precision);
  
  const allocations = Array.from({ length: count }, (_, i) => {
    const isLast = i === count - 1;
    const percentage = isLast 
      ? 100 - basePercentage * (count - 1)
      : basePercentage;
    const amount = isLast
      ? totalAmount - Math.round(baseAmount * multiplier) / multiplier * (count - 1)
      : Math.round(baseAmount * multiplier) / multiplier;
    
    return { percentage, amount };
  });
  
  return allocations;
}

/**
 * Validate percentages sum to 100
 */
export function validatePercentageSum(percentages: number[], tolerance: number = 0.01): boolean {
  const sum = percentages.reduce((acc, p) => acc + p, 0);
  return Math.abs(sum - 100) <= tolerance;
}

/**
 * Normalize percentages to sum to exactly 100
 */
export function normalizePercentages(percentages: number[]): number[] {
  const sum = percentages.reduce((acc, p) => acc + p, 0);
  if (sum === 0) return percentages;
  
  const normalized = percentages.map(p => (p / sum) * 100);
  
  // Adjust for rounding errors
  const normalizedSum = normalized.reduce((acc, p) => acc + p, 0);
  const diff = 100 - normalizedSum;
  
  if (diff !== 0 && normalized.length > 0) {
    normalized[0] += diff;
  }
  
  return normalized.map(p => Math.round(p * 100) / 100);
}

/**
 * Create distribution with IDs
 */
export function createDistribution(
  totalAmount: number,
  shares: Array<{ id: string; percentage: number }>
): DistributionResult {
  const percentages = shares.map(s => s.percentage);
  const isValid = validatePercentageSum(percentages);
  
  const amounts = calculateAmountsFromPercentages(totalAmount, percentages);
  const totalDistributed = amounts.reduce((acc, a) => acc + a, 0);
  const remainder = totalAmount - totalDistributed;
  
  const allocations = shares.map((share, i) => ({
    id: share.id,
    percentage: share.percentage,
    amount: amounts[i],
  }));
  
  return {
    allocations,
    totalDistributed,
    remainder,
    isValid,
  };
}

/**
 * Adjust share and redistribute
 */
export function adjustShareAndRedistribute(
  shares: ShareAllocation[],
  targetId: string,
  newPercentage: number,
  lockIds: string[] = []
): ShareAllocation[] {
  const targetIndex = shares.findIndex(s => s.id === targetId);
  if (targetIndex === -1) return shares;
  
  const oldPercentage = shares[targetIndex].percentage;
  const diff = newPercentage - oldPercentage;
  
  // Find adjustable shares (not locked and not target)
  const adjustableShares = shares.filter(
    s => s.id !== targetId && !lockIds.includes(s.id)
  );
  
  if (adjustableShares.length === 0 || diff === 0) {
    return shares.map(s => s.id === targetId ? { ...s, percentage: newPercentage } : s);
  }
  
  // Calculate adjustment per share
  const totalAdjustable = adjustableShares.reduce((acc, s) => acc + s.percentage, 0);
  
  return shares.map(share => {
    if (share.id === targetId) {
      return { ...share, percentage: newPercentage };
    }
    if (lockIds.includes(share.id)) {
      return share;
    }
    
    // Proportional adjustment
    const proportion = share.percentage / totalAdjustable;
    const adjustment = diff * proportion;
    const newPct = Math.max(0, share.percentage - adjustment);
    
    return { ...share, percentage: Math.round(newPct * 100) / 100 };
  });
}

/**
 * Format percentage for display
 */
export function formatPercentage(percentage: number, decimals: number = 1): string {
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format share amount
 */
export function formatShareAmount(
  amount: number,
  currency: string = 'ETH',
  decimals: number = 6
): string {
  return `${amount.toFixed(decimals)} ${currency}`;
}

/**
 * Calculate minimum viable share
 */
export function calculateMinimumShare(
  totalAmount: number,
  recipientCount: number,
  minAmount: number = 0.0001
): number {
  const minPercentage = (minAmount / totalAmount) * 100;
  const maxPossibleShares = Math.floor(100 / minPercentage);
  return Math.min(recipientCount, maxPossibleShares);
}

