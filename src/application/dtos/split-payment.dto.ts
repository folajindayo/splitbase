/**
 * Split Payment DTOs
 */

export interface SplitPaymentDTO {
  id: string;
  initiator: string;
  totalAmount: string;
  recipients: RecipientDTO[];
  status: string;
  createdAt: Date;
}

export interface RecipientDTO {
  address: string;
  amount: string;
  percentage: number;
}

export interface CreateSplitPaymentDTO {
  initiator: string;
  totalAmount: string;
  recipients: RecipientDTO[];
}

export interface ExecutePaymentDTO {
  paymentId: string;
  signature: string;
}

export interface PaymentStatusDTO {
  id: string;
  status: string;
  txHash?: string;
  confirmedAt?: Date;
}
