export interface WalletBalance {
  address: string;
  native: string;
  tokens: TokenBalance[];
}

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  decimals: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  token?: string;
  timestamp: string;
  status: "pending" | "confirmed" | "failed";
}

export class CustodyService {
  async getBalance(address: string): Promise<WalletBalance> {
    // Mock implementation
    return {
      address,
      native: "12.34 ETH",
      tokens: [
        {
          symbol: "USDC",
          name: "USD Coin",
          address: "0xa0b8...",
          balance: "1000.00",
          decimals: 6,
        },
        {
          symbol: "DAI",
          name: "Dai Stablecoin",
          address: "0x6b17...",
          balance: "500.50",
          decimals: 18,
        },
      ],
    };
  }

  async getTransactions(address: string, limit: number = 10): Promise<Transaction[]> {
    // Mock implementation
    return Array.from({ length: limit }, (_, i) => ({
      hash: `0x${Math.random().toString(16).slice(2)}`,
      from: i % 2 === 0 ? address : `0x${Math.random().toString(16).slice(2, 42)}`,
      to: i % 2 === 0 ? `0x${Math.random().toString(16).slice(2, 42)}` : address,
      amount: `${(Math.random() * 5).toFixed(4)} ETH`,
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      status: "confirmed",
    }));
  }

  async transfer(
    from: string,
    to: string,
    amount: string,
    token?: string
  ): Promise<Transaction> {
    // Mock implementation
    return {
      hash: `0x${Math.random().toString(16).slice(2)}`,
      from,
      to,
      amount,
      token,
      timestamp: new Date().toISOString(),
      status: "pending",
    };
  }

  async estimateGas(to: string, amount: string, token?: string): Promise<string> {
    // Mock implementation
    return "0.0021 ETH";
  }
}

export const custodyService = new CustodyService();

