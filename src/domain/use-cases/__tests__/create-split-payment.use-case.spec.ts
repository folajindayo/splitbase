/**
 * CreateSplitPaymentUseCase Tests
 */

import { CreateSplitPaymentUseCase } from '../create-split-payment.use-case';

describe('CreateSplitPaymentUseCase', () => {
  let useCase: CreateSplitPaymentUseCase;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    };
    useCase = new CreateSplitPaymentUseCase(mockRepository);
  });

  it('should create split payment successfully', async () => {
    const input = {
      creator: '0x123',
      totalAmount: '1000',
      recipients: [
        { address: '0x456', percentage: 50 },
        { address: '0x789', percentage: 50 },
      ],
      token: { address: '0xabc', symbol: 'USDC', decimals: 6 },
      chainId: 1,
    };

    const result = await useCase.execute(input);

    expect(result).toHaveProperty('id');
    expect(result.status).toBe('pending');
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should validate recipient percentages sum to 100', async () => {
    const input = {
      creator: '0x123',
      totalAmount: '1000',
      recipients: [
        { address: '0x456', percentage: 40 },
        { address: '0x789', percentage: 40 },
      ],
      token: { address: '0xabc', symbol: 'USDC', decimals: 6 },
      chainId: 1,
    };

    await expect(useCase.execute(input)).rejects.toThrow();
  });
});


