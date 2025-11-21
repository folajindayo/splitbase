/**
 * Split Payment Entity
 * Represents a split payment transaction with recipients
 */

export interface SplitPaymentProps {
  id: string;
  creator: string;
  totalAmount: bigint;
  token: TokenInfo;
  recipients: Recipient[];
  status: PaymentStatus;
  createdAt: Date;
  executedAt?: Date;
  transactionHash?: string;
  chainId: number;
  metadata?: PaymentMetadata;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

export interface Recipient {
  address: string;
  percentage: number;
  amount: bigint;
  ens?: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface PaymentMetadata {
  description?: string;
  reference?: string;
  tags?: string[];
}

export class SplitPaymentEntity {
  private constructor(private readonly props: SplitPaymentProps) {}

  static create(props: SplitPaymentProps): SplitPaymentEntity {
    this.validate(props);
    return new SplitPaymentEntity(props);
  }

  private static validate(props: SplitPaymentProps): void {
    if (!props.id) {
      throw new Error('Payment ID is required');
    }

    if (!props.creator || !/^0x[a-fA-F0-9]{40}$/.test(props.creator)) {
      throw new Error('Invalid creator address');
    }

    if (props.totalAmount <= 0n) {
      throw new Error('Total amount must be greater than 0');
    }

    if (props.recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    const totalPercentage = props.recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Recipient percentages must sum to 100');
    }
  }

  get id(): string {
    return this.props.id;
  }

  get creator(): string {
    return this.props.creator;
  }

  get totalAmount(): bigint {
    return this.props.totalAmount;
  }

  get recipients(): Recipient[] {
    return [...this.props.recipients];
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  isPending(): boolean {
    return this.props.status === PaymentStatus.PENDING;
  }

  isCompleted(): boolean {
    return this.props.status === PaymentStatus.COMPLETED;
  }

  canExecute(): boolean {
    return this.props.status === PaymentStatus.PENDING;
  }

  execute(transactionHash: string): SplitPaymentEntity {
    if (!this.canExecute()) {
      throw new Error('Payment cannot be executed in current status');
    }

    return new SplitPaymentEntity({
      ...this.props,
      status: PaymentStatus.COMPLETED,
      executedAt: new Date(),
      transactionHash,
    });
  }

  cancel(): SplitPaymentEntity {
    if (!this.isPending()) {
      throw new Error('Only pending payments can be cancelled');
    }

    return new SplitPaymentEntity({
      ...this.props,
      status: PaymentStatus.CANCELLED,
    });
  }

  toJSON() {
    return {
      id: this.props.id,
      creator: this.props.creator,
      totalAmount: this.props.totalAmount.toString(),
      token: this.props.token,
      recipients: this.props.recipients.map((r) => ({
        ...r,
        amount: r.amount.toString(),
      })),
      status: this.props.status,
      createdAt: this.props.createdAt.toISOString(),
      executedAt: this.props.executedAt?.toISOString(),
      transactionHash: this.props.transactionHash,
      chainId: this.props.chainId,
      metadata: this.props.metadata,
    };
  }
}

