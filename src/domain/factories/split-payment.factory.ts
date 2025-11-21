/**
 * Split Payment Factory
 */

import { SplitPayment } from '../entities/split-payment.entity';

export class SplitPaymentFactory {
  static create(data: any): SplitPayment {
    return new SplitPayment(
      data.id,
      data.initiator,
      data.totalAmount,
      data.recipients,
      data.status,
      data.createdAt
    );
  }

  static createFromAPI(apiData: any): SplitPayment {
    return SplitPaymentFactory.create({
      id: apiData.id,
      initiator: apiData.initiator,
      totalAmount: apiData.total_amount,
      recipients: apiData.recipients || [],
      status: apiData.status || 'pending',
      createdAt: apiData.created_at || new Date(),
    });
  }
}

