/**
 * Decimal Utility Functions
 */

export function toDecimal(value: string, decimals: number): string {
  const bigValue = BigInt(value);
  const divisor = BigInt(10 ** decimals);
  const whole = bigValue / divisor;
  const fraction = bigValue % divisor;
  
  if (fraction === 0n) return whole.toString();
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  return `${whole}.${fractionStr}`;
}

export function fromDecimal(value: string, decimals: number): string {
  const [whole, fraction = ''] = value.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return (BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction)).toString();
}

export function roundDecimal(value: string, precision: number): string {
  const num = parseFloat(value);
  return num.toFixed(precision);
}


