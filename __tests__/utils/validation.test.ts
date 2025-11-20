/**
 * Split Validation Tests
 */

import { SplitValidator } from '../lib/validation/split.validator';
import { Recipient } from '../lib/utils/split-calculator';

describe('SplitValidator', () => {
  it('should validate correct recipients', () => {
    const recipients: Recipient[] = [
      { address: '0x1234567890123456789012345678901234567890', percentage: 50 },
      { address: '0x0987654321098765432109876543210987654321', percentage: 50 },
    ];

    const errors = SplitValidator.validateRecipients(recipients);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid address', () => {
    const recipients: Recipient[] = [
      { address: 'invalid', percentage: 100 },
    ];

    const errors = SplitValidator.validateRecipients(recipients);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject percentages not summing to 100', () => {
    const recipients: Recipient[] = [
      { address: '0x1234567890123456789012345678901234567890', percentage: 30 },
      { address: '0x0987654321098765432109876543210987654321', percentage: 30 },
    ];

    const errors = SplitValidator.validateRecipients(recipients);
    expect(errors.some(e => e.includes('100'))).toBe(true);
  });
});

