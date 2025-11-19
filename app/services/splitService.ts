export interface SplitRecipient {
  address: string;
  percentage: number;
}

export interface SplitData {
  id: string;
  owner: string;
  recipients: SplitRecipient[];
  totalDistributed: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class SplitService {
  async getSplit(id: string): Promise<SplitData | null> {
    // Mock implementation
    return {
      id,
      owner: "0x1234...",
      recipients: [
        { address: "0xaaaa...", percentage: 40 },
        { address: "0xbbbb...", percentage: 30 },
        { address: "0xcccc...", percentage: 30 },
      ],
      totalDistributed: "5.5 ETH",
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getSplitsByOwner(address: string): Promise<SplitData[]> {
    // Mock implementation
    return Array.from({ length: 3 }, (_, i) => ({
      id: `split-${i}`,
      owner: address,
      recipients: [
        { address: `0x${i}111...`, percentage: 50 },
        { address: `0x${i}222...`, percentage: 50 },
      ],
      totalDistributed: `${(Math.random() * 20).toFixed(2)} ETH`,
      isActive: i % 2 === 0,
      createdAt: new Date(Date.now() - i * 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }

  async createSplit(
    owner: string,
    recipients: SplitRecipient[]
  ): Promise<SplitData> {
    // Validate percentages sum to 100
    const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (totalPercentage !== 100) {
      throw new Error("Recipient percentages must sum to 100");
    }

    // Mock implementation
    return {
      id: `split-${Date.now()}`,
      owner,
      recipients,
      totalDistributed: "0 ETH",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async distributeFunds(id: string, amount: string): Promise<boolean> {
    // Mock implementation
    console.log(`Distributing ${amount} for split ${id}`);
    return true;
  }

  async deactivateSplit(id: string): Promise<boolean> {
    // Mock implementation
    console.log(`Deactivating split ${id}`);
    return true;
  }
}

export const splitService = new SplitService();

