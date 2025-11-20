/**
 * Split Types
 */

export interface Split {
  id: string;
  contractAddress: string;
  recipients: SplitRecipient[];
  totalReceived: string;
  totalDistributed: string;
  createdAt: Date;
  creator: string;
}

export interface SplitRecipient {
  address: string;
  percentage: number;
  amountReceived: string;
}

export interface SplitEvent {
  type: 'created' | 'distributed' | 'received';
  amount: string;
  timestamp: Date;
  txHash: string;
}

