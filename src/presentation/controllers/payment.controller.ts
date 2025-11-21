/**
 * Payment Controller
 */

import { CreateSplitPaymentUseCase } from '../../domain/use-cases/create-split-payment.use-case';
import { PaymentExecutionService } from '../../application/services/payment-execution.service';
import { SplitPaymentMapper } from '../../application/mappers/split-payment.mapper';

export class PaymentController {
  constructor(
    private readonly createSplitUseCase: CreateSplitPaymentUseCase,
    private readonly executionService: PaymentExecutionService
  ) {}

  async createSplit(req: {
    creator: string;
    totalAmount: string;
    token: any;
    recipients: any[];
    chainId: number;
  }) {
    try {
      const payment = await this.createSplitUseCase.execute({
        ...req,
        totalAmount: BigInt(req.totalAmount),
      });

      return {
        success: true,
        data: SplitPaymentMapper.toDTO(payment),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async executePayment(req: { paymentId: string; transactionHash: string }) {
    try {
      const payment = await this.executionService.executePayment(
        req.paymentId,
        req.transactionHash
      );

      return {
        success: true,
        data: SplitPaymentMapper.toDTO(payment),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async cancelPayment(req: { paymentId: string }) {
    try {
      const payment = await this.executionService.cancelPayment(req.paymentId);

      return {
        success: true,
        data: SplitPaymentMapper.toDTO(payment),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

