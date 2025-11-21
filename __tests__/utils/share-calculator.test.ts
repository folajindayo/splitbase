/**
 * Share Calculator Tests
 */

import { calculateShares, validateShares } from '../lib/utils/share-calculator';

describe('Share Calculator', () => {
  describe('calculateShares', () => {
    it('calculates shares correctly', () => {
      const shares = [
        { recipient: '0x1', percentage: 50 },
        { recipient: '0x2', percentage: 50 },
      ];

      const result = calculateShares(BigInt('1000000000000000000'), shares);
      
      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(BigInt('500000000000000000'));
      expect(result[1].amount).toBe(BigInt('500000000000000000'));
    });

    it('handles uneven splits', () => {
      const shares = [
        { recipient: '0x1', percentage: 60 },
        { recipient: '0x2', percentage: 40 },
      ];

      const result = calculateShares(BigInt('1000000000000000000'), shares);
      
      expect(result[0].amount).toBe(BigInt('600000000000000000'));
      expect(result[1].amount).toBe(BigInt('400000000000000000'));
    });
  });

  describe('validateShares', () => {
    it('validates correct total', () => {
      const shares = [
        { percentage: 50 },
        { percentage: 50 },
      ];

      const result = validateShares(shares);
      expect(result.valid).toBe(true);
    });

    it('rejects incorrect total', () => {
      const shares = [
        { percentage: 50 },
        { percentage: 40 },
      ];

      const result = validateShares(shares);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});

