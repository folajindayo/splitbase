/**
 * Escrow Service
 */

export interface EscrowData {
  id: string;
  creator: string;
  recipients: Array<{ address: string; share: number }>;
  totalAmount: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export class EscrowService {
  async createEscrow(
    recipients: Array<{ address: string; share: number }>,
    amount: string
  ): Promise<{ escrowId: string; txHash: string }> {
    try {
      const response = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, amount }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create escrow');
      }
      
      return await response.json();
    } catch (error) {
      console.error('EscrowService create error:', error);
      throw error;
    }
  }

  async getEscrowDetails(escrowId: string): Promise<EscrowData | null> {
    try {
      const response = await fetch(`/api/escrow/${escrowId}`);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('EscrowService get error:', error);
      return null;
    }
  }

  async releaseEscrow(escrowId: string): Promise<{ txHash: string }> {
    try {
      const response = await fetch(`/api/escrow/${escrowId}/release`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to release escrow');
      }
      
      return await response.json();
    } catch (error) {
      console.error('EscrowService release error:', error);
      throw error;
    }
  }
}

export const escrowService = new EscrowService();

