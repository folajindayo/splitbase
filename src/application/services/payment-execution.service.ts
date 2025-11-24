/**
 * Payment Execution Service
 * Application layer service for executing split payments
 */

import { ISplitPaymentRepository } from '../../domain/repositories/split-payment.repository';

export class PaymentExecutionService {
  constructor(private readonly paymentRepository: ISplitPaymentRepository) {}

  async executePayment(paymentId: string, transactionHash: string) {
    const payment = await this.paymentRepository.findById(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (!payment.canExecute()) {
      throw new Error('Payment cannot be executed');
    }

    const executedPayment = payment.execute(transactionHash);
    return await this.paymentRepository.update(paymentId, executedPayment);
  }

  async cancelPayment(paymentId: string) {
    const payment = await this.paymentRepository.findById(paymentId);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    const cancelledPayment = payment.cancel();
    return await this.paymentRepository.update(paymentId, cancelledPayment);
  }

  async getPaymentStatus(paymentId: string) {
    const payment = await this.paymentRepository.findById(paymentId);
    return payment?.status;
  }
}


