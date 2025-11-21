/**
 * Split Payment DTOs
 */

export interface SplitPaymentDTO {
  id: string;
  creator: string;
  totalAmount: string;
  token: TokenInfoDTO;
  recipients: RecipientDTO[];
  status: string;
  createdAt: string;
  executedAt?: string;
  transactionHash?: string;
  chainId: number;
  metadata?: PaymentMetadataDTO;
}

export interface TokenInfoDTO {
  address: string;
  symbol: string;
  decimals: number;
}

export interface RecipientDTO {
  address: string;
  percentage: number;
  amount: string;
  ens?: string;
}

export interface PaymentMetadataDTO {
  description?: string;
  reference?: string;
  tags?: string[];
}

export interface CreateSplitPaymentRequestDTO {
  creator: string;
  totalAmount: string;
  token: TokenInfoDTO;
  recipients: RecipientDTO[];
  chainId: number;
  metadata?: PaymentMetadataDTO;
}

