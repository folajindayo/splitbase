/**
 * Split Payment Repository Interface
 */

import { SplitPaymentEntity, PaymentStatus } from '../entities/split-payment.entity';

export interface PaymentFilters {
  creator?: string;
  status?: PaymentStatus;
  chainId?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface ISplitPaymentRepository {
  findById(id: string): Promise<SplitPaymentEntity | null>;
  findByCreator(address: string): Promise<SplitPaymentEntity[]>;
  findByRecipient(address: string): Promise<SplitPaymentEntity[]>;
  findAll(filters: PaymentFilters): Promise<SplitPaymentEntity[]>;
  create(payment: SplitPaymentEntity): Promise<SplitPaymentEntity>;
  update(id: string, payment: SplitPaymentEntity): Promise<SplitPaymentEntity>;
  delete(id: string): Promise<void>;
  countByStatus(status: PaymentStatus): Promise<number>;
}

