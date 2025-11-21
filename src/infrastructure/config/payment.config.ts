/**
 * Payment Configuration
 */

export interface PaymentConfig {
  maxRecipients: number;
  minAmount: bigint;
  supportedTokens: string[];
  gasBuffer: number;
}

export const paymentConfig: PaymentConfig = {
  maxRecipients: 100,
  minAmount: 1000n,
  supportedTokens: [],
  gasBuffer: 20, // 20% gas buffer
};

