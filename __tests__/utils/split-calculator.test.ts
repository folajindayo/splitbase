/**
 * Split Calculator Tests
 */

import {
  validateSplitPercentages,
  calculateShares,
  Recipient,
} from '../lib/utils/split-calculator';

describe('validateSplitPercentages', () => {
  it('should validate correct percentages', () => {
    const recipients: Recipient[] = [
      { address: '0x123', percentage: 50 },
      { address: '0x456', percentage: 50 },
    ];
    expect(validateSplitPercentages(recipients)).toBe(true);
  });

  it('should reject invalid percentages', () => {
    const recipients: Recipient[] = [
      { address: '0x123', percentage: 50 },
      { address: '0x456', percentage: 30 },
    ];
    expect(validateSplitPercentages(recipients)).toBe(false);
  });
});

describe('calculateShares', () => {
  it('should calculate shares correctly', () => {
    const recipients: Recipient[] = [
      { address: '0x123', percentage: 60 },
      { address: '0x456', percentage: 40 },
    ];
    const shares = calculateShares('100', recipients);
    expect(shares['0x123']).toBe('60');
    expect(shares['0x456']).toBe('40');
  });
});

