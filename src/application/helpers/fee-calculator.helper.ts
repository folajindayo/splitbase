/**
 * Fee Calculator Helper
 */

export class FeeCalculator {
  private static PLATFORM_FEE_PERCENTAGE = 0.5; // 0.5%
  private static BASE_GAS_COST = 21000;
  private static PER_RECIPIENT_GAS = 5000;

  static calculatePlatformFee(amount: string): string {
    const value = parseFloat(amount);
    const fee = value * (FeeCalculator.PLATFORM_FEE_PERCENTAGE / 100);
    return fee.toFixed(6);
  }

  static calculateNetAmount(amount: string): string {
    const value = parseFloat(amount);
    const fee = parseFloat(FeeCalculator.calculatePlatformFee(amount));
    return (value - fee).toFixed(6);
  }

  static estimateGasCost(recipientCount: number, gasPrice: string): string {
    const totalGas = FeeCalculator.BASE_GAS_COST + 
                     (recipientCount * FeeCalculator.PER_RECIPIENT_GAS);
    const gasCost = totalGas * parseFloat(gasPrice);
    return gasCost.toString();
  }

  static calculateTotalCost(amount: string, gasCost: string): string {
    const total = parseFloat(amount) + parseFloat(gasCost);
    return total.toFixed(6);
  }
}

