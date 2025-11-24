/**
 * Create Split Payment Use Case
 */

import { ISplitPaymentRepository } from '../repositories/split-payment.repository';
import { SplitPaymentEntity, PaymentStatus, Recipient, TokenInfo } from '../entities/split-payment.entity';

export interface CreateSplitPaymentRequest {
  creator: string;
  totalAmount: bigint;
  token: TokenInfo;
  recipients: Recipient[];
  chainId: number;
  metadata?: {
    description?: string;
    reference?: string;
  };
}

export class CreateSplitPaymentUseCase {
  constructor(private readonly paymentRepository: ISplitPaymentRepository) {}

  async execute(request: CreateSplitPaymentRequest): Promise<SplitPaymentEntity> {
    this.validateRequest(request);
    this.validateRecipients(request.recipients);
    this.calculateRecipientAmounts(request.totalAmount, request.recipients);

    const payment = SplitPaymentEntity.create({
      id: this.generateId(),
      creator: request.creator,
      totalAmount: request.totalAmount,
      token: request.token,
      recipients: request.recipients,
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
      chainId: request.chainId,
      metadata: request.metadata,
    });

    return await this.paymentRepository.create(payment);
  }

  private validateRequest(request: CreateSplitPaymentRequest): void {
    if (request.recipients.length === 0) {
      throw new Error('At least one recipient is required');
    }

    if (request.recipients.length > 100) {
      throw new Error('Maximum 100 recipients allowed');
    }

    if (request.totalAmount <= 0n) {
      throw new Error('Total amount must be greater than 0');
    }
  }

  private validateRecipients(recipients: Recipient[]): void {
    const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error('Recipient percentages must sum to 100%');
    }

    const addresses = new Set(recipients.map((r) => r.address.toLowerCase()));
    if (addresses.size !== recipients.length) {
      throw new Error('Duplicate recipient addresses found');
    }
  }

  private calculateRecipientAmounts(total: bigint, recipients: Recipient[]): void {
    for (const recipient of recipients) {
      recipient.amount = (total * BigInt(Math.floor(recipient.percentage * 100))) / 10000n;
    }
  }

  private generateId(): string {
    return `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}


