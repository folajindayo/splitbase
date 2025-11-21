/**
 * Split Payment Entity Tests
 */

import { SplitPaymentEntity, PaymentStatus } from '../split-payment.entity';

describe('SplitPaymentEntity', () => {
  const validProps = {
    id: 'payment-1',
    creator: '0x' + '1'.repeat(40),
    totalAmount: 1000n,
    token: {
      address: '0x' + '2'.repeat(40),
      symbol: 'USDC',
      decimals: 6,
    },
    recipients: [
      {
        address: '0x' + '3'.repeat(40),
        percentage: 50,
        amount: 500n,
      },
      {
        address: '0x' + '4'.repeat(40),
        percentage: 50,
        amount: 500n,
      },
    ],
    status: PaymentStatus.PENDING,
    createdAt: new Date(),
    chainId: 1,
  };

  describe('create', () => {
    it('should create a valid payment entity', () => {
      const payment = SplitPaymentEntity.create(validProps);
      expect(payment.id).toBe(validProps.id);
      expect(payment.totalAmount).toBe(validProps.totalAmount);
    });

    it('should throw error if percentages dont sum to 100', () => {
      expect(() =>
        SplitPaymentEntity.create({
          ...validProps,
          recipients: [
            { address: '0x' + '3'.repeat(40), percentage: 40, amount: 400n },
            { address: '0x' + '4'.repeat(40), percentage: 40, amount: 400n },
          ],
        })
      ).toThrow('Recipient percentages must sum to 100');
    });
  });

  describe('business logic', () => {
    it('should execute payment', () => {
      const payment = SplitPaymentEntity.create(validProps);
      const executed = payment.execute('0xtxhash');
      expect(executed.status).toBe(PaymentStatus.COMPLETED);
      expect(executed.transactionHash).toBe('0xtxhash');
    });

    it('should cancel pending payment', () => {
      const payment = SplitPaymentEntity.create(validProps);
      const cancelled = payment.cancel();
      expect(cancelled.status).toBe(PaymentStatus.CANCELLED);
    });

    it('should throw error when executing non-pending payment', () => {
      const payment = SplitPaymentEntity.create({
        ...validProps,
        status: PaymentStatus.COMPLETED,
      });
      expect(() => payment.execute('0xtxhash')).toThrow();
    });
  });
});

