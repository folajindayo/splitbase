/**
 * Split Limits Constants
 */

export const SPLIT_LIMITS = {
  MIN_RECIPIENTS: 2,
  MAX_RECIPIENTS: 20,
  MIN_SHARE: 1,
  MAX_SHARE: 100,
  MIN_AMOUNT: 0.001,
  MAX_AMOUNT: 1000000,
} as const;

export const SPLIT_FEES = {
  PLATFORM_FEE_PERCENTAGE: 1,
  GAS_BUFFER_PERCENTAGE: 10,
} as const;

export function validateSplitLimits(
  recipientsCount: number,
  totalShare: number
): { valid: boolean; error?: string } {
  if (recipientsCount < SPLIT_LIMITS.MIN_RECIPIENTS) {
    return { valid: false, error: 'Minimum 2 recipients required' };
  }

  if (recipientsCount > SPLIT_LIMITS.MAX_RECIPIENTS) {
    return { valid: false, error: `Maximum ${SPLIT_LIMITS.MAX_RECIPIENTS} recipients allowed` };
  }

  if (totalShare !== 100) {
    return { valid: false, error: 'Total share must equal 100%' };
  }

  return { valid: true };
}

