import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum WalletType {
  MAIN = 'main',
  ESCROW = 'escrow',
  SAVINGS = 'savings',
  BUSINESS = 'business',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  ESCROW_LOCK = 'escrow_lock',
  ESCROW_RELEASE = 'escrow_release',
  ESCROW_REFUND = 'escrow_refund',
  FEE = 'fee',
  REFUND = 'refund',
  INTEREST = 'interest',
  REWARD = 'reward',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
}

export interface Wallet {
  id: string;
  userId: string;
  type: WalletType;
  currency: Currency;
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: Currency;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
  from?: {
    walletId?: string;
    userId?: string;
    external?: string;
  };
  to?: {
    walletId?: string;
    userId?: string;
    external?: string;
  };
  fee?: number;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface TransactionReceipt {
  transactionId: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: string;
  from?: string;
  to?: string;
  fee?: number;
  reference?: string;
}

export interface WalletBalance {
  total: number;
  available: number;
  locked: number;
  currency: Currency;
}

export interface TransferRequest {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface WalletStatistics {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalVolume: number;
  averageTransaction: number;
  byType: Record<TransactionType, number>;
  timeline: Array<{ date: string; volume: number; transactions: number }>;
}

class WalletSystem {
  private static instance: WalletSystem;
  private readonly MIN_TRANSACTION_AMOUNT = 0.01;
  private readonly MAX_TRANSACTION_AMOUNT = 1000000;

  private constructor() {}

  static getInstance(): WalletSystem {
    if (!WalletSystem.instance) {
      WalletSystem.instance = new WalletSystem();
    }
    return WalletSystem.instance;
  }

  // Create wallet
  async createWallet(data: {
    userId: string;
    type: WalletType;
    currency: Currency;
    metadata?: Record<string, any>;
  }): Promise<Wallet> {
    try {
      const walletData = {
        user_id: data.userId,
        type: data.type,
        currency: data.currency,
        balance: 0,
        available_balance: 0,
        locked_balance: 0,
        active: true,
        metadata: data.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: wallet, error } = await supabase
        .from('wallets')
        .insert(walletData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToWallet(wallet);
    } catch (error: any) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  // Get wallet
  async getWallet(walletId: string): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
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
  async getUserWallets(userId: string, type?: WalletType): Promise<Wallet[]> {
    try {
      let query = supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true);

      if (type) {
        query = query.eq('type', type);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToWallet);
    } catch (error) {
      console.error('Failed to get user wallets:', error);
      return [];
    }
  }

  // Get wallet balance
  async getBalance(walletId: string): Promise<WalletBalance | null> {
    try {
      const wallet = await this.getWallet(walletId);

      if (!wallet) return null;

      return {
        total: wallet.balance,
        available: wallet.availableBalance,
        locked: wallet.lockedBalance,
        currency: wallet.currency,
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      return null;
    }
  }

  // Deposit funds
  async deposit(
    walletId: string,
    amount: number,
    reference?: string,
    metadata?: Record<string, any>
  ): Promise<Transaction> {
    try {
      this.validateAmount(amount);

      const wallet = await this.getWallet(walletId);

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (!wallet.active) {
        throw new Error('Wallet is not active');
      }

      // Create transaction
      const transaction = await this.createTransaction({
        walletId,
        type: TransactionType.DEPOSIT,
        amount,
        currency: wallet.currency,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance + amount,
        description: 'Deposit',
        reference,
        metadata,
      });

      // Update wallet balance
      await this.updateWalletBalance(walletId, wallet.balance + amount);

      return transaction;
    } catch (error: any) {
      console.error('Failed to deposit:', error);
      throw error;
    }
  }

  // Withdraw funds
  async withdraw(
    walletId: string,
    amount: number,
    reference?: string,
    metadata?: Record<string, any>
  ): Promise<Transaction> {
    try {
      this.validateAmount(amount);

      const wallet = await this.getWallet(walletId);

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (!wallet.active) {
        throw new Error('Wallet is not active');
      }

      if (wallet.availableBalance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create transaction
      const transaction = await this.createTransaction({
        walletId,
        type: TransactionType.WITHDRAWAL,
        amount,
        currency: wallet.currency,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance - amount,
        description: 'Withdrawal',
        reference,
        metadata,
      });

      // Update wallet balance
      await this.updateWalletBalance(walletId, wallet.balance - amount);

      return transaction;
    } catch (error: any) {
      console.error('Failed to withdraw:', error);
      throw error;
    }
  }

  // Transfer funds
  async transfer(request: TransferRequest): Promise<Transaction> {
    try {
      this.validateAmount(request.amount);

      const fromWallet = await this.getWallet(request.fromWalletId);
      const toWallet = await this.getWallet(request.toWalletId);

      if (!fromWallet || !toWallet) {
        throw new Error('Wallet not found');
      }

      if (fromWallet.currency !== toWallet.currency) {
        throw new Error('Currency mismatch');
      }

      if (fromWallet.availableBalance < request.amount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from source wallet
      await this.createTransaction({
        walletId: request.fromWalletId,
        type: TransactionType.TRANSFER,
        amount: -request.amount,
        currency: fromWallet.currency,
        balanceBefore: fromWallet.balance,
        balanceAfter: fromWallet.balance - request.amount,
        description: request.description || 'Transfer out',
        reference: request.reference,
        to: { walletId: request.toWalletId },
        metadata: request.metadata,
      });

      // Add to destination wallet
      const transaction = await this.createTransaction({
        walletId: request.toWalletId,
        type: TransactionType.TRANSFER,
        amount: request.amount,
        currency: toWallet.currency,
        balanceBefore: toWallet.balance,
        balanceAfter: toWallet.balance + request.amount,
        description: request.description || 'Transfer in',
        reference: request.reference,
        from: { walletId: request.fromWalletId },
        metadata: request.metadata,
      });

      // Update balances
      await this.updateWalletBalance(
        request.fromWalletId,
        fromWallet.balance - request.amount
      );
      await this.updateWalletBalance(
        request.toWalletId,
        toWallet.balance + request.amount
      );

      return transaction;
    } catch (error: any) {
      console.error('Failed to transfer:', error);
      throw error;
    }
  }

  // Lock funds (for escrow)
  async lockFunds(
    walletId: string,
    amount: number,
    reference?: string
  ): Promise<boolean> {
    try {
      const wallet = await this.getWallet(walletId);

      if (!wallet) return false;

      if (wallet.availableBalance < amount) {
        throw new Error('Insufficient available balance');
      }

      const { error } = await supabase
        .from('wallets')
        .update({
          available_balance: wallet.availableBalance - amount,
          locked_balance: wallet.lockedBalance + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', walletId);

      if (error) throw error;

      // Record transaction
      await this.createTransaction({
        walletId,
        type: TransactionType.ESCROW_LOCK,
        amount: -amount,
        currency: wallet.currency,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        description: 'Funds locked for escrow',
        reference,
      });

      return true;
    } catch (error) {
      console.error('Failed to lock funds:', error);
      return false;
    }
  }

  // Release locked funds
  async releaseFunds(
    walletId: string,
    amount: number,
    reference?: string
  ): Promise<boolean> {
    try {
      const wallet = await this.getWallet(walletId);

      if (!wallet) return false;

      if (wallet.lockedBalance < amount) {
        throw new Error('Insufficient locked balance');
      }

      const { error } = await supabase
        .from('wallets')
        .update({
          available_balance: wallet.availableBalance + amount,
          locked_balance: wallet.lockedBalance - amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', walletId);

      if (error) throw error;

      // Record transaction
      await this.createTransaction({
        walletId,
        type: TransactionType.ESCROW_RELEASE,
        amount,
        currency: wallet.currency,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        description: 'Funds released from escrow',
        reference,
      });

      return true;
    } catch (error) {
      console.error('Failed to release funds:', error);
      return false;
    }
  }

  // Get transaction
  async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
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

  // Get wallet transactions
  async getTransactions(
    walletId: string,
    filter: {
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {}
  ): Promise<Transaction[]> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', walletId);

      if (filter.type) {
        query = query.eq('type', filter.type);
      }

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.startDate) {
        query = query.gte('created_at', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('created_at', filter.endDate);
      }

      query = query.order('created_at', { ascending: false });

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToTransaction);
    } catch (error) {
      console.error('Failed to get transactions:', error);
      return [];
    }
  }

  // Get wallet statistics
  async getStatistics(
    walletId: string,
    filter: {
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<WalletStatistics> {
    try {
      const transactions = await this.getTransactions(walletId, filter);

      const stats: WalletStatistics = {
        totalTransactions: transactions.length,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalVolume: 0,
        averageTransaction: 0,
        byType: {} as Record<TransactionType, number>,
        timeline: [],
      };

      const dailyData: Record<string, { volume: number; transactions: number }> = {};

      transactions.forEach((tx) => {
        stats.totalVolume += Math.abs(tx.amount);

        if (tx.type === TransactionType.DEPOSIT) {
          stats.totalDeposits += tx.amount;
        } else if (tx.type === TransactionType.WITHDRAWAL) {
          stats.totalWithdrawals += Math.abs(tx.amount);
        }

        stats.byType[tx.type] = (stats.byType[tx.type] || 0) + 1;

        // Track by date
        const date = tx.createdAt.split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { volume: 0, transactions: 0 };
        }
        dailyData[date].volume += Math.abs(tx.amount);
        dailyData[date].transactions++;
      });

      stats.averageTransaction =
        stats.totalTransactions > 0
          ? stats.totalVolume / stats.totalTransactions
          : 0;

      stats.timeline = Object.entries(dailyData)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return stats;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        totalTransactions: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalVolume: 0,
        averageTransaction: 0,
        byType: {} as any,
        timeline: [],
      };
    }
  }

  // Generate receipt
  async generateReceipt(transactionId: string): Promise<TransactionReceipt | null> {
    try {
      const transaction = await this.getTransaction(transactionId);

      if (!transaction) return null;

      return {
        transactionId: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        type: transaction.type,
        status: transaction.status,
        timestamp: transaction.createdAt,
        from: transaction.from?.userId || transaction.from?.external,
        to: transaction.to?.userId || transaction.to?.external,
        fee: transaction.fee,
        reference: transaction.reference,
      };
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      return null;
    }
  }

  // Create transaction
  private async createTransaction(
    data: Omit<Transaction, 'id' | 'createdAt' | 'completedAt' | 'status'>
  ): Promise<Transaction> {
    const transactionData = {
      wallet_id: data.walletId,
      type: data.type,
      status: TransactionStatus.COMPLETED,
      amount: data.amount,
      currency: data.currency,
      balance_before: data.balanceBefore,
      balance_after: data.balanceAfter,
      description: data.description,
      reference: data.reference,
      metadata: data.metadata,
      from_data: data.from,
      to_data: data.to,
      fee: data.fee,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) throw error;

    return this.mapToTransaction(transaction);
  }

  // Update wallet balance
  private async updateWalletBalance(
    walletId: string,
    newBalance: number
  ): Promise<void> {
    await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        available_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', walletId);
  }

  // Validate amount
  private validateAmount(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (amount < this.MIN_TRANSACTION_AMOUNT) {
      throw new Error(`Amount must be at least ${this.MIN_TRANSACTION_AMOUNT}`);
    }

    if (amount > this.MAX_TRANSACTION_AMOUNT) {
      throw new Error(`Amount cannot exceed ${this.MAX_TRANSACTION_AMOUNT}`);
    }
  }

  // Map database record to Wallet
  private mapToWallet(data: any): Wallet {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      currency: data.currency,
      balance: data.balance,
      availableBalance: data.available_balance,
      lockedBalance: data.locked_balance,
      active: data.active,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // Map database record to Transaction
  private mapToTransaction(data: any): Transaction {
    return {
      id: data.id,
      walletId: data.wallet_id,
      type: data.type,
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      balanceBefore: data.balance_before,
      balanceAfter: data.balance_after,
      description: data.description,
      reference: data.reference,
      metadata: data.metadata,
      from: data.from_data,
      to: data.to_data,
      fee: data.fee,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      failureReason: data.failure_reason,
    };
  }
}

// Export singleton instance
export const walletSystem = WalletSystem.getInstance();

// Convenience functions
export const createWallet = (data: any) => walletSystem.createWallet(data);
export const getWallet = (walletId: string) => walletSystem.getWallet(walletId);
export const getUserWallets = (userId: string, type?: WalletType) =>
  walletSystem.getUserWallets(userId, type);
export const deposit = (walletId: string, amount: number, reference?: string) =>
  walletSystem.deposit(walletId, amount, reference);
export const withdraw = (walletId: string, amount: number, reference?: string) =>
  walletSystem.withdraw(walletId, amount, reference);
export const transfer = (request: TransferRequest) => walletSystem.transfer(request);
export const getBalance = (walletId: string) => walletSystem.getBalance(walletId);

