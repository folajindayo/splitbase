/**
 * Share Calculator
 */

export function calculateShares(
  totalAmount: bigint,
  shares: { recipient: string; percentage: number }[]
): { recipient: string; amount: bigint }[] {
  const PRECISION = 10000n; // 100.00%
  
  return shares.map((share) => {
    const percentage = BigInt(Math.floor(share.percentage * 100));
    const amount = (totalAmount * percentage) / PRECISION;
    
    return {
      recipient: share.recipient,
      amount,
    };
  });
}

export function validateShares(
  shares: { percentage: number }[]
): { valid: boolean; error?: string } {
  const total = shares.reduce((sum, s) => sum + s.percentage, 0);
  
  if (Math.abs(total - 100) > 0.01) {
    return {
      valid: false,
      error: `Shares must total 100%, currently ${total.toFixed(2)}%`,
    };
  }
  
  return { valid: true };
}

