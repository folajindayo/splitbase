/**
 * Split Validation
 */

import { Recipient } from '../utils/split-calculator';

export class SplitValidator {
  static validateRecipients(recipients: Recipient[]): string[] {
    const errors: string[] = [];

    if (recipients.length === 0) {
      errors.push('At least one recipient is required');
    }

    if (recipients.length > 50) {
      errors.push('Maximum 50 recipients allowed');
    }

    recipients.forEach((r, i) => {
      if (!r.address.match(/^0x[a-fA-F0-9]{40}$/)) {
        errors.push(`Invalid address at position ${i + 1}`);
      }
      if (r.percentage <= 0 || r.percentage > 100) {
        errors.push(`Invalid percentage at position ${i + 1}`);
      }
    });

    const total = recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (Math.abs(total - 100) > 0.01) {
      errors.push(`Percentages must sum to 100% (current: ${total}%)`);
    }

    return errors;
  }
}

