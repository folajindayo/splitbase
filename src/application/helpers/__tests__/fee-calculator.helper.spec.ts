/**
 * Fee Calculator Helper Tests
 */

import { FeeCalculator } from '../fee-calculator.helper';

describe('FeeCalculator', () => {
  describe('calculatePlatformFee', () => {
    it('should calculate fee correctly', () => {
      expect(FeeCalculator.calculatePlatformFee('100')).toBe('0.500000');
      expect(FeeCalculator.calculatePlatformFee('1000')).toBe('5.000000');
    });

    it('should handle decimal amounts', () => {
      expect(FeeCalculator.calculatePlatformFee('100.50')).toBe('0.502500');
    });
  });

  describe('calculateNetAmount', () => {
    it('should calculate net amount after fee', () => {
      expect(FeeCalculator.calculateNetAmount('100')).toBe('99.500000');
      expect(FeeCalculator.calculateNetAmount('1000')).toBe('995.000000');
    });
  });

  describe('estimateGasCost', () => {
    it('should estimate gas for multiple recipients', () => {
      const gasCost = FeeCalculator.estimateGasCost(5, '20');
      expect(parseFloat(gasCost)).toBeGreaterThan(0);
    });

    it('should increase with more recipients', () => {
      const cost1 = parseFloat(FeeCalculator.estimateGasCost(1, '20'));
      const cost5 = parseFloat(FeeCalculator.estimateGasCost(5, '20'));
      expect(cost5).toBeGreaterThan(cost1);
    });
  });

  describe('calculateTotalCost', () => {
    it('should sum amount and gas cost', () => {
      expect(FeeCalculator.calculateTotalCost('100', '2')).toBe('102.000000');
    });
  });
});


