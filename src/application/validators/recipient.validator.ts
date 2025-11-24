/**
 * Recipient Validator
 */

export interface RecipientInput {
  address: string;
  percentage: number;
}

export class RecipientValidator {
  static validate(recipients: RecipientInput[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (recipients.length === 0) {
      errors.push('At least one recipient is required');
    }

    if (recipients.length > 100) {
      errors.push('Maximum 100 recipients allowed');
    }

    // Check for duplicate addresses
    const addresses = recipients.map((r) => r.address.toLowerCase());
    const uniqueAddresses = new Set(addresses);
    if (addresses.length !== uniqueAddresses.size) {
      errors.push('Duplicate recipient addresses found');
    }

    // Validate percentages sum to 100
    const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      errors.push(`Percentages must sum to 100%, got ${totalPercentage}%`);
    }

    // Validate individual percentages
    for (const recipient of recipients) {
      if (recipient.percentage <= 0) {
        errors.push(`Percentage must be positive for ${recipient.address}`);
      }
      if (recipient.percentage > 100) {
        errors.push(`Percentage cannot exceed 100% for ${recipient.address}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static validateOrThrow(recipients: RecipientInput[]): void {
    const result = this.validate(recipients);
    if (!result.valid) {
      throw new Error(result.errors.join(', '));
    }
  }
}


