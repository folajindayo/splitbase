/**
 * Decimal Utilities
 */

export function toDecimal(value: bigint, decimals: number): number {
  return Number(value) / Math.pow(10, decimals);
}

export function fromDecimal(value: number, decimals: number): bigint {
  return BigInt(Math.floor(value * Math.pow(10, decimals)));
}

export function formatDecimal(value: number, decimals: number = 4): string {
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

export function parseDecimal(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

