import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum CryptoNetwork {
  ETHEREUM = 'ethereum',
  BITCOIN = 'bitcoin',
  BINANCE_SMART_CHAIN = 'binance_smart_chain',
  POLYGON = 'polygon',
  SOLANA = 'solana',
  AVALANCHE = 'avalanche',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  PAYMENT = 'payment',
  REFUND = 'refund',
  TRANSFER = 'transfer',
  SWAP = 'swap',
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum WalletType {
  HOT_WALLET = 'hot_wallet',
  COLD_WALLET = 'cold_wallet',
  CUSTODIAL = 'custodial',
  NON_CUSTODIAL = 'non_custodial',
}

export interface CryptoCurrency {
  id: string;
  symbol: string;
  name: string;
  network: CryptoNetwork;
  contractAddress?: string;
  decimals: number;
  logo: string;
  priceUsd: number;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  active: boolean;
}

export interface Wallet {
  id: string;
  userId: string;
  type: WalletType;
  address: string;
  network: CryptoNetwork;
  label?: string;
  balance: Record<string, number>;
  encrypted: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CryptoTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  currency: string;
  network: CryptoNetwork;
  amount: number;
  amountUsd: number;
  from: string;
  to: string;
  hash?: string;
  blockNumber?: number;
  confirmations: number;
  requiredConfirmations: number;
  status: TransactionStatus;
  fee?: number;
  feeUsd?: number;
  memo?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequest {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  acceptedCurrencies: string[];
  description?: string;
  orderId?: string;
  customerId?: string;
  expiresAt: string;
  callbackUrl?: string;
  redirectUrl?: string;
  status: 'pending' | 'paid' | 'expired' | 'canceled';
  paidAmount?: number;
  paidCurrency?: string;
  paidAt?: string;
  transactionHash?: string;
  createdAt: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: string;
  source: string;
}

export interface SwapQuote {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  priceImpact: number;
  route: string[];
  expiresAt: string;
  createdAt: string;
}

export interface Swap {
  id: string;
  userId: string;
  quoteId: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  status: TransactionStatus;
  txHash?: string;
  createdAt: string;
  completedAt?: string;
}

export interface StakingPool {
  id: string;
  currency: string;
  network: CryptoNetwork;
  apy: number;
  minStake: number;
  lockupPeriod?: number;
  totalStaked: number;
  participants: number;
  active: boolean;
}

export interface Stake {
  id: string;
  userId: string;
  poolId: string;
  amount: number;
  rewards: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'unstaking' | 'completed';
}

export interface GasEstimate {
  network: CryptoNetwork;
  type: 'slow' | 'standard' | 'fast';
  gasPrice: number;
  gasLimit: number;
  estimatedFee: number;
  estimatedTime: number;
}

export interface TokenPrice {
  currency: string;
  priceUsd: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  updatedAt: string;
}

export interface PaymentWebhook {
  id: string;
  merchantId: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
}

export interface CryptoAnalytics {
  totalVolume: number;
  totalTransactions: number;
  uniqueUsers: number;
  averageTransactionValue: number;
  topCurrencies: Array<{
    currency: string;
    volume: number;
    transactions: number;
  }>;
  networkDistribution: Record<CryptoNetwork, number>;
  trends: Array<{
    date: string;
    volume: number;
    transactions: number;
  }>;
}

class CryptoPaymentSystem {
  private static instance: CryptoPaymentSystem;
  private priceCache: Map<string, TokenPrice> = new Map();

  private constructor() {
    this.startPriceUpdater();
  }

  static getInstance(): CryptoPaymentSystem {
    if (!CryptoPaymentSystem.instance) {
      CryptoPaymentSystem.instance = new CryptoPaymentSystem();
    }
    return CryptoPaymentSystem.instance;
  }

  // Create wallet
  async createWallet(wallet: Omit<Wallet, 'id' | 'balance' | 'createdAt' | 'updatedAt'>): Promise<Wallet> {
    try {
      const walletData = {
        user_id: wallet.userId,
        type: wallet.type,
        address: wallet.address,
        network: wallet.network,
        label: wallet.label,
        balance: {},
        encrypted: wallet.encrypted,
        verified: wallet.verified,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('crypto_wallets')
        .insert(walletData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToWallet(data);
    } catch (error: any) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  // Get wallet
  async getWallet(walletId: string): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (error || !data) return null;

      return this.mapToWallet(data);
    } catch (error) {
      console.error('Failed to get wallet:', error);
      return null;
    }
  }

  // Get user wallets
  async getUserWallets(userId: string): Promise<Wallet[]> {
    try {
      const { data, error } = await supabase
        .from('crypto_wallets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapToWallet);
    } catch (error) {
      console.error('Failed to get user wallets:', error);
      return [];
    }
  }

  // Get balance
  async getBalance(walletId: string, currency?: string): Promise<number> {
    try {
      const wallet = await this.getWallet(walletId);

      if (!wallet) return 0;

      if (currency) {
        return wallet.balance[currency] || 0;
      }

      // Return total balance in USD
      let totalUsd = 0;
      for (const [curr, amount] of Object.entries(wallet.balance)) {
        const price = await this.getPrice(curr);
        totalUsd += amount * price.priceUsd;
      }

      return totalUsd;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  }

  // Create transaction
  async createTransaction(transaction: Omit<CryptoTransaction, 'id' | 'confirmations' | 'status' | 'createdAt' | 'updatedAt'>): Promise<CryptoTransaction> {
    try {
      const transactionData = {
        user_id: transaction.userId,
        type: transaction.type,
        currency: transaction.currency,
        network: transaction.network,
        amount: transaction.amount,
        amount_usd: transaction.amountUsd,
        from: transaction.from,
        to: transaction.to,
        hash: transaction.hash,
        block_number: transaction.blockNumber,
        confirmations: 0,
        required_confirmations: transaction.requiredConfirmations,
        status: TransactionStatus.PENDING,
        fee: transaction.fee,
        fee_usd: transaction.feeUsd,
        memo: transaction.memo,
        metadata: transaction.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('crypto_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) throw error;

      // Monitor transaction
      if (transaction.hash) {
        await this.monitorTransaction(data.id, transaction.hash, transaction.network);
      }

      return this.mapToTransaction(data);
    } catch (error: any) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  }

  // Get transaction
  async getTransaction(transactionId: string): Promise<CryptoTransaction | null> {
    try {
      const { data, error } = await supabase
        .from('crypto_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error || !data) return null;

      return this.mapToTransaction(data);
    } catch (error) {
      console.error('Failed to get transaction:', error);
      return null;
    }
  }

  // Get user transactions
  async getUserTransactions(userId: string, limit: number = 50): Promise<CryptoTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('crypto_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.mapToTransaction);
    } catch (error) {
      console.error('Failed to get user transactions:', error);
      return [];
    }
  }

  // Create payment request
  async createPaymentRequest(request: Omit<PaymentRequest, 'id' | 'status' | 'createdAt'>): Promise<PaymentRequest> {
    try {
      const requestData = {
        merchant_id: request.merchantId,
        amount: request.amount,
        currency: request.currency,
        accepted_currencies: request.acceptedCurrencies,
        description: request.description,
        order_id: request.orderId,
        customer_id: request.customerId,
        expires_at: request.expiresAt,
        callback_url: request.callbackUrl,
        redirect_url: request.redirectUrl,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('payment_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToPaymentRequest(data);
    } catch (error: any) {
      console.error('Failed to create payment request:', error);
      throw error;
    }
  }

  // Pay payment request
  async payPaymentRequest(requestId: string, currency: string, txHash: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: 'paid',
          paid_currency: currency,
          paid_at: new Date().toISOString(),
          transaction_hash: txHash,
        })
        .eq('id', requestId);

      return !error;
    } catch (error) {
      console.error('Failed to pay payment request:', error);
      return false;
    }
  }

  // Get exchange rate
  async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    try {
      // Get prices
      const fromPrice = await this.getPrice(from);
      const toPrice = await this.getPrice(to);

      const rate = fromPrice.priceUsd / toPrice.priceUsd;

      return {
        from,
        to,
        rate,
        timestamp: new Date().toISOString(),
        source: 'internal',
      };
    } catch (error) {
      console.error('Failed to get exchange rate:', error);
      throw error;
    }
  }

  // Get swap quote
  async getSwapQuote(fromCurrency: string, toCurrency: string, fromAmount: number): Promise<SwapQuote> {
    try {
      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      const toAmount = fromAmount * rate.rate;
      const fee = toAmount * 0.003; // 0.3% fee
      const finalAmount = toAmount - fee;

      const quoteData = {
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: fromAmount,
        to_amount: finalAmount,
        rate: rate.rate,
        fee,
        price_impact: 0,
        route: [fromCurrency, toCurrency],
        expires_at: new Date(Date.now() + 60000).toISOString(), // 1 minute
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('swap_quotes')
        .insert(quoteData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToSwapQuote(data);
    } catch (error: any) {
      console.error('Failed to get swap quote:', error);
      throw error;
    }
  }

  // Execute swap
  async executeSwap(userId: string, quoteId: string): Promise<Swap> {
    try {
      const { data: quote } = await supabase
        .from('swap_quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (!quote) {
        throw new Error('Quote not found');
      }

      // Check if quote expired
      if (new Date(quote.expires_at) < new Date()) {
        throw new Error('Quote expired');
      }

      const swapData = {
        user_id: userId,
        quote_id: quoteId,
        from_currency: quote.from_currency,
        to_currency: quote.to_currency,
        from_amount: quote.from_amount,
        to_amount: quote.to_amount,
        rate: quote.rate,
        fee: quote.fee,
        status: TransactionStatus.PENDING,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('swaps')
        .insert(swapData)
        .select()
        .single();

      if (error) throw error;

      // Process swap (deduct from currency, add to currency)
      await this.processSwap(data.id);

      return this.mapToSwap(data);
    } catch (error: any) {
      console.error('Failed to execute swap:', error);
      throw error;
    }
  }

  // Get price
  async getPrice(currency: string): Promise<TokenPrice> {
    try {
      // Check cache
      const cached = this.priceCache.get(currency);
      if (cached && Date.now() - new Date(cached.updatedAt).getTime() < 60000) {
        return cached;
      }

      // Fetch from database
      const { data, error } = await supabase
        .from('token_prices')
        .select('*')
        .eq('currency', currency)
        .single();

      if (error || !data) {
        // Return default
        return {
          currency,
          priceUsd: 0,
          priceChange24h: 0,
          volume24h: 0,
          marketCap: 0,
          updatedAt: new Date().toISOString(),
        };
      }

      const price = this.mapToTokenPrice(data);
      this.priceCache.set(currency, price);

      return price;
    } catch (error) {
      console.error('Failed to get price:', error);
      throw error;
    }
  }

  // Estimate gas
  async estimateGas(network: CryptoNetwork, type: 'slow' | 'standard' | 'fast' = 'standard'): Promise<GasEstimate> {
    try {
      // Simplified gas estimation
      const baseFees = {
        [CryptoNetwork.ETHEREUM]: { slow: 20, standard: 30, fast: 50 },
        [CryptoNetwork.BITCOIN]: { slow: 1, standard: 3, fast: 5 },
        [CryptoNetwork.BINANCE_SMART_CHAIN]: { slow: 5, standard: 5, fast: 5 },
        [CryptoNetwork.POLYGON]: { slow: 30, standard: 50, fast: 100 },
      };

      const gasPrice = baseFees[network]?.[type] || 30;
      const gasLimit = 21000;
      const estimatedFee = (gasPrice * gasLimit) / 1e9;

      return {
        network,
        type,
        gasPrice,
        gasLimit,
        estimatedFee,
        estimatedTime: type === 'slow' ? 300 : type === 'standard' ? 60 : 15,
      };
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  // Get analytics
  async getAnalytics(days: number = 30): Promise<CryptoAnalytics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: transactions } = await supabase
        .from('crypto_transactions')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const totalVolume = transactions?.reduce((sum, t) => sum + t.amount_usd, 0) || 0;
      const uniqueUsers = new Set(transactions?.map(t => t.user_id)).size;
      const averageTransactionValue = transactions?.length ? totalVolume / transactions.length : 0;

      // Top currencies
      const currencyMap = new Map<string, { volume: number; transactions: number }>();
      transactions?.forEach(t => {
        const curr = currencyMap.get(t.currency) || { volume: 0, transactions: 0 };
        curr.volume += t.amount_usd;
        curr.transactions += 1;
        currencyMap.set(t.currency, curr);
      });

      const topCurrencies = Array.from(currencyMap.entries())
        .map(([currency, data]) => ({ currency, ...data }))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);

      return {
        totalVolume,
        totalTransactions: transactions?.length || 0,
        uniqueUsers,
        averageTransactionValue,
        topCurrencies,
        networkDistribution: {} as any,
        trends: [],
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        totalVolume: 0,
        totalTransactions: 0,
        uniqueUsers: 0,
        averageTransactionValue: 0,
        topCurrencies: [],
        networkDistribution: {} as any,
        trends: [],
      };
    }
  }

  // Helper methods
  private async monitorTransaction(transactionId: string, hash: string, network: CryptoNetwork): Promise<void> {
    try {
      // Simplified monitoring - in production, use blockchain APIs
      setTimeout(async () => {
        await supabase
          .from('crypto_transactions')
          .update({
            status: TransactionStatus.CONFIRMED,
            confirmations: 12,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);
      }, 30000); // 30 seconds
    } catch (error) {
      console.error('Failed to monitor transaction:', error);
    }
  }

  private async processSwap(swapId: string): Promise<void> {
    try {
      // Simplified swap processing
      setTimeout(async () => {
        await supabase
          .from('swaps')
          .update({
            status: TransactionStatus.COMPLETED,
            completed_at: new Date().toISOString(),
          })
          .eq('id', swapId);
      }, 5000); // 5 seconds
    } catch (error) {
      console.error('Failed to process swap:', error);
    }
  }

  private startPriceUpdater(): void {
    // Update prices every minute
    setInterval(() => {
      this.updatePrices();
    }, 60000);
  }

  private async updatePrices(): Promise<void> {
    try {
      // In production, fetch from price API
      // For now, just clear cache to force refresh
      this.priceCache.clear();
    } catch (error) {
      console.error('Failed to update prices:', error);
    }
  }

  private mapToWallet(data: any): Wallet {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      address: data.address,
      network: data.network,
      label: data.label,
      balance: data.balance,
      encrypted: data.encrypted,
      verified: data.verified,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToTransaction(data: any): CryptoTransaction {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      currency: data.currency,
      network: data.network,
      amount: data.amount,
      amountUsd: data.amount_usd,
      from: data.from,
      to: data.to,
      hash: data.hash,
      blockNumber: data.block_number,
      confirmations: data.confirmations,
      requiredConfirmations: data.required_confirmations,
      status: data.status,
      fee: data.fee,
      feeUsd: data.fee_usd,
      memo: data.memo,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapToPaymentRequest(data: any): PaymentRequest {
    return {
      id: data.id,
      merchantId: data.merchant_id,
      amount: data.amount,
      currency: data.currency,
      acceptedCurrencies: data.accepted_currencies,
      description: data.description,
      orderId: data.order_id,
      customerId: data.customer_id,
      expiresAt: data.expires_at,
      callbackUrl: data.callback_url,
      redirectUrl: data.redirect_url,
      status: data.status,
      paidAmount: data.paid_amount,
      paidCurrency: data.paid_currency,
      paidAt: data.paid_at,
      transactionHash: data.transaction_hash,
      createdAt: data.created_at,
    };
  }

  private mapToSwapQuote(data: any): SwapQuote {
    return {
      id: data.id,
      fromCurrency: data.from_currency,
      toCurrency: data.to_currency,
      fromAmount: data.from_amount,
      toAmount: data.to_amount,
      rate: data.rate,
      fee: data.fee,
      priceImpact: data.price_impact,
      route: data.route,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
    };
  }

  private mapToSwap(data: any): Swap {
    return {
      id: data.id,
      userId: data.user_id,
      quoteId: data.quote_id,
      fromCurrency: data.from_currency,
      toCurrency: data.to_currency,
      fromAmount: data.from_amount,
      toAmount: data.to_amount,
      rate: data.rate,
      fee: data.fee,
      status: data.status,
      txHash: data.tx_hash,
      createdAt: data.created_at,
      completedAt: data.completed_at,
    };
  }

  private mapToTokenPrice(data: any): TokenPrice {
    return {
      currency: data.currency,
      priceUsd: data.price_usd,
      priceChange24h: data.price_change_24h,
      volume24h: data.volume_24h,
      marketCap: data.market_cap,
      updatedAt: data.updated_at,
    };
  }
}

// Export singleton instance
export const cryptoPayment = CryptoPaymentSystem.getInstance();

// Convenience functions
export const createCryptoWallet = (wallet: any) => cryptoPayment.createWallet(wallet);
export const getCryptoWallet = (walletId: string) => cryptoPayment.getWallet(walletId);
export const getUserCryptoWallets = (userId: string) => cryptoPayment.getUserWallets(userId);
export const getCryptoBalance = (walletId: string, currency?: string) => cryptoPayment.getBalance(walletId, currency);
export const createCryptoTransaction = (transaction: any) => cryptoPayment.createTransaction(transaction);
export const getCryptoTransaction = (transactionId: string) => cryptoPayment.getTransaction(transactionId);
export const createCryptoPaymentRequest = (request: any) => cryptoPayment.createPaymentRequest(request);
export const getExchangeRate = (from: string, to: string) => cryptoPayment.getExchangeRate(from, to);
export const getSwapQuote = (fromCurrency: string, toCurrency: string, fromAmount: number) =>
  cryptoPayment.getSwapQuote(fromCurrency, toCurrency, fromAmount);
export const executeSwap = (userId: string, quoteId: string) => cryptoPayment.executeSwap(userId, quoteId);
export const getTokenPrice = (currency: string) => cryptoPayment.getPrice(currency);
export const estimateGasFee = (network: CryptoNetwork, type?: 'slow' | 'standard' | 'fast') =>
  cryptoPayment.estimateGas(network, type);
export const getCryptoAnalytics = (days?: number) => cryptoPayment.getAnalytics(days);


