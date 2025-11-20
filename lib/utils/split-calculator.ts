/**
 * Split Calculator Utilities
 */

export interface Recipient {
  address: string;
  percentage: number;
}

export function validateSplitPercentages(recipients: Recipient[]): boolean {
  const total = recipients.reduce((sum, r) => sum + r.percentage, 0);
  return Math.abs(total - 100) < 0.01;
}

export function calculateShares(
  amount: string,
  recipients: Recipient[]
): Record<string, string> {
  const total = BigInt(amount);
  const shares: Record<string, string> = {};

  recipients.forEach((recipient) => {
    const share = (total * BigInt(Math.floor(recipient.percentage * 100))) / 10000n;
    shares[recipient.address] = share.toString();
  });

  return shares;
}

