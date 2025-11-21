/**
 * Payment Type Definitions
 */

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface IRecipient {
  address: string;
  percentage: number;
  ens?: string;
}

export interface ITokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
}

export interface ISplitPayment {
  id: string;
  creator: string;
  totalAmount: string;
  token: ITokenInfo;
  recipients: IRecipient[];
  chainId: number;
  status: PaymentStatus;
  txHash?: string;
  createdAt: string;
  executedAt?: string;
  metadata?: {
    description?: string;
    reference?: string;
  };
}

export interface IPaymentExecution {
  paymentId: string;
  txHash: string;
  gasUsed: string;
  distributions: Array<{
    recipient: string;
    amount: string;
    success: boolean;
  }>;
}

