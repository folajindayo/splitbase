/**
 * Zod validation schemas
 */

import { z } from "zod";

// Ethereum address schema
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

// Amount schema (for token amounts)
export const amountSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Invalid amount format")
  .refine((val) => parseFloat(val) > 0, "Amount must be positive");

// Escrow creation schema
export const createEscrowSchema = z.object({
  buyer: ethereumAddressSchema,
  seller: ethereumAddressSchema,
  amount: amountSchema,
  token: ethereumAddressSchema.optional(),
  description: z.string().min(1).max(500),
  deadline: z.string().datetime(),
});

export type CreateEscrowInput = z.infer<typeof createEscrowSchema>;

// Split creation schema
export const createSplitSchema = z.object({
  recipients: z
    .array(
      z.object({
        address: ethereumAddressSchema,
        percentage: z.number().min(0).max(100),
      })
    )
    .min(2, "Must have at least 2 recipients")
    .refine(
      (recipients) => {
        const total = recipients.reduce((sum, r) => sum + r.percentage, 0);
        return Math.abs(total - 100) < 0.01;
      },
      "Percentages must sum to 100"
    ),
  token: ethereumAddressSchema.optional(),
  name: z.string().min(1).max(100),
});

export type CreateSplitInput = z.infer<typeof createSplitSchema>;

// Custody deposit schema
export const depositSchema = z.object({
  amount: amountSchema,
  token: ethereumAddressSchema,
  recipient: ethereumAddressSchema,
});

export type DepositInput = z.infer<typeof depositSchema>;

// User profile schema
export const userProfileSchema = z.object({
  address: ethereumAddressSchema,
  username: z.string().min(3).max(20).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// Sort schema
export const sortSchema = z.object({
  sortBy: z.string(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type SortInput = z.infer<typeof sortSchema>;

// Query schema (pagination + sort)
export const querySchema = paginationSchema.merge(sortSchema.partial());

export type QueryInput = z.infer<typeof querySchema>;

