/**
 * Payment Validation Schemas
 */

import { z } from 'zod';

export const RecipientSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  percentage: z.number().min(0.01).max(100),
  ens: z.string().optional(),
});

export const TokenInfoSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  symbol: z.string().min(1).max(10),
  decimals: z.number().int().min(0).max(18),
});

export const CreateSplitPaymentSchema = z.object({
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  totalAmount: z.string().regex(/^\d+$/),
  token: TokenInfoSchema,
  recipients: z.array(RecipientSchema).min(1).max(100),
  chainId: z.number().int().positive(),
  metadata: z.object({
    description: z.string().optional(),
    reference: z.string().optional(),
  }).optional(),
}).refine(
  (data) => {
    const totalPercentage = data.recipients.reduce((sum, r) => sum + r.percentage, 0);
    return Math.abs(totalPercentage - 100) < 0.01;
  },
  { message: 'Recipient percentages must sum to 100%' }
);

export type CreateSplitPaymentInput = z.infer<typeof CreateSplitPaymentSchema>;
export type RecipientInput = z.infer<typeof RecipientSchema>;

