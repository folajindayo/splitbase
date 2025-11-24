/**
 * Split Calculator Tests
 */

import { 
  calculateEvenSplit, 
  calculateProportionalSplit, 
  validatePercentages 
} from '../split-calculator.util';

describe('SplitCalculator', () => {
  describe('calculateEvenSplit', () => {
    it('should divide amount evenly', () => {
      const result = calculateEvenSplit('1000', 4);
      expect(result).toHaveLength(4);
      result.forEach(amount => {
        expect(amount).toBe('250');
      });
    });

    it('should handle decimal splits', () => {
      const result = calculateEvenSplit('1000', 3);
      expect(result).toHaveLength(3);
    });
  });

  describe('calculateProportionalSplit', () => {
    it('should calculate proportional splits', () => {
      const percentages = [50, 30, 20];
      const result = calculateProportionalSplit('1000', percentages);
      expect(result).toEqual(['500', '300', '200']);
    });
  });

  describe('validatePercentages', () => {
    it('should validate percentages sum to 100', () => {
      expect(validatePercentages([50, 30, 20])).toBe(true);
    });

    it('should reject percentages not summing to 100', () => {
      expect(validatePercentages([50, 30, 15])).toBe(false);
    });
  });
});


