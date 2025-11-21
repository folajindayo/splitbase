/**
 * Split Calculator Utility
 */

export class SplitCalculator {
  static calculateRecipientAmounts(
    total: bigint,
    percentages: number[]
  ): bigint[] {
    const amounts: bigint[] = [];
    let remaining = total;

    for (let i = 0; i < percentages.length; i++) {
      if (i === percentages.length - 1) {
        // Last recipient gets the remainder
        amounts.push(remaining);
      } else {
        const amount = (total * BigInt(Math.floor(percentages[i] * 100))) / 10000n;
        amounts.push(amount);
        remaining -= amount;
      }
    }

    return amounts;
  }

  static validatePercentages(percentages: number[]): boolean {
    const sum = percentages.reduce((a, b) => a + b, 0);
    return Math.abs(sum - 100) < 0.01;
  }

  static normalizePercentages(percentages: number[]): number[] {
    const sum = percentages.reduce((a, b) => a + b, 0);
    return percentages.map((p) => (p / sum) * 100);
  }
}

