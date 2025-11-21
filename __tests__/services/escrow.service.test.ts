/**
 * EscrowService Tests
 */

import { escrowService } from '../lib/services/escrow.service';

global.fetch = jest.fn();

describe('EscrowService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEscrow', () => {
    it('creates escrow successfully', async () => {
      const mockResponse = {
        escrowId: 'escrow-1',
        txHash: '0xabc',
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const recipients = [
        { address: '0x1', share: 50 },
        { address: '0x2', share: 50 },
      ];

      const result = await escrowService.createEscrow(recipients, '1.0');
      expect(result).toEqual(mockResponse);
    });

    it('throws error on failed creation', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const recipients = [
        { address: '0x1', share: 100 },
      ];

      await expect(
        escrowService.createEscrow(recipients, '1.0')
      ).rejects.toThrow();
    });
  });

  describe('getEscrowDetails', () => {
    it('fetches escrow details', async () => {
      const mockDetails = {
        id: 'escrow-1',
        creator: '0x123',
        recipients: [],
        totalAmount: '1.0',
        status: 'active' as const,
        createdAt: '2024-01-01',
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockDetails,
      });

      const result = await escrowService.getEscrowDetails('escrow-1');
      expect(result).toEqual(mockDetails);
    });
  });
});

