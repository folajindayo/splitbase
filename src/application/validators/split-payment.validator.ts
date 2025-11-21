/**
 * Split Payment Validators
 */

import { z } from 'zod';

export const recipientSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  percentage: z.number().min(0).max(100),
});

export const createSplitPaymentSchema = z.object({
  initiator: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  totalAmount: z.string().regex(/^\d+(\.\d+)?$/),
  recipients: z.array(recipientSchema).min(2).max(100),
}).refine(data => {
  const totalPercentage = data.recipients.reduce((sum, r) => sum + r.percentage, 0);
  return Math.abs(totalPercentage - 100) < 0.01;
}, {
  message: "Recipient percentages must sum to 100%",
});

export const executePaymentSchema = z.object({
  paymentId: z.string().uuid(),
  signature: z.string().min(1),
});

export class SplitPaymentValidator {
  static validateCreate(data: unknown) {
    return createSplitPaymentSchema.parse(data);
  }

  static validateExecute(data: unknown) {
    return executePaymentSchema.parse(data);
  }

  static validateRecipient(data: unknown) {
    return recipientSchema.parse(data);
  }
}

