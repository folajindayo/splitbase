/**
 * Percentage Utilities
 */

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function distributePercentages(count: number): number[] {
  const basePercentage = 100 / count;
  const percentages = Array(count).fill(basePercentage);
  
  // Adjust for rounding
  const sum = percentages.reduce((a, b) => a + b, 0);
  const diff = 100 - sum;
  percentages[0] += diff;
  
  return percentages;
}

