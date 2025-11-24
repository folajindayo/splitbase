/**
 * Gas Estimator Utility
 */

export class GasEstimator {
  private static readonly BASE_GAS = 21000n;
  private static readonly PER_RECIPIENT_GAS = 50000n;

  static estimateSplitGas(recipientCount: number): bigint {
    return this.BASE_GAS + this.PER_RECIPIENT_GAS * BigInt(recipientCount);
  }

  static calculateGasCost(gasAmount: bigint, gasPrice: bigint): bigint {
    return gasAmount * gasPrice;
  }

  static addGasBuffer(gasAmount: bigint, bufferPercent: number = 20): bigint {
    const buffer = (gasAmount * BigInt(bufferPercent)) / 100n;
    return gasAmount + buffer;
  }

  static formatGasPrice(gasPrice: bigint): string {
    const gwei = Number(gasPrice) / 1e9;
    return `${gwei.toFixed(2)} Gwei`;
  }
}


