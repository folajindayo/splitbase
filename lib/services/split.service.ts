/**
 * Split Service
 */

import { Recipient } from '../utils/split-calculator';

export interface SplitContract {
  address: string;
  recipients: Recipient[];
  createdAt: Date;
}

export class SplitService {
  async createSplit(recipients: Recipient[]): Promise<string> {
    const response = await fetch('/api/splits/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipients }),
    });
    if (!response.ok) throw new Error('Failed to create split');
    const data = await response.json();
    return data.address;
  }

  async getSplits(ownerAddress: string): Promise<SplitContract[]> {
    const response = await fetch(`/api/splits?owner=${ownerAddress}`);
    if (!response.ok) throw new Error('Failed to fetch splits');
    return response.json();
  }
}

