import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square',
  BRAINTREE = 'braintree',
  CRYPTO = 'crypto',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  CRYPTO = 'crypto',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  AUTHORIZED = 'authorized',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
  BTC = 'BTC',
  ETH = 'ETH',
}

export interface PaymentRequest {
  amount: number;
  currency: Currency;
  provider: PaymentProvider;
  method: PaymentMethod;
  customerId?: string;
  description?: string;
  metadata?: Record<string, any>;
  paymentMethodId?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface Payment {
  id: string;
  providerId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  customerId?: string;
  description?: string;
  metadata?: Record<string, any>;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: Currency;
  reason?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface PaymentMethodData {
  id: string;
  type: PaymentMethod;
  provider: PaymentProvider;
  customerId: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

class PaymentGateway {
  private static instance: PaymentGateway;
  private providers: Map<PaymentProvider, any> = new Map();

  private constructor() {}

  static getInstance(): PaymentGateway {
    if (!PaymentGateway.instance) {
      PaymentGateway.instance = new PaymentGateway();
    }
    return PaymentGateway.instance;
  }

  // Initialize provider
  initializeProvider(provider: PaymentProvider, config: any): void {
    // In production, initialize actual payment provider SDKs
    switch (provider) {
      case PaymentProvider.STRIPE:
        // const stripe = require('stripe')(config.secretKey);
        // this.providers.set(provider, stripe);
        this.providers.set(provider, { type: 'stripe', config });
        break;
      case PaymentProvider.PAYPAL:
        // Initialize PayPal SDK
        this.providers.set(provider, { type: 'paypal', config });
        break;
      case PaymentProvider.SQUARE:
        // Initialize Square SDK
        this.providers.set(provider, { type: 'square', config });
        break;
      case PaymentProvider.CRYPTO:
        // Initialize crypto payment processor
        this.providers.set(provider, { type: 'crypto', config });
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // Create payment
  async createPayment(request: PaymentRequest): Promise<Payment> {
    try {
      // Validate provider is initialized
      if (!this.providers.has(request.provider)) {
        throw new Error(`Provider ${request.provider} not initialized`);
      }

      // Create payment with provider
      const providerId = await this.createProviderPayment(request);

      // Save to database
      const paymentData = {
        provider_id: providerId,
        provider: request.provider,
        method: request.method,
        amount: request.amount,
        currency: request.currency,
        status: PaymentStatus.PENDING,
        customer_id: request.customerId,
        description: request.description,
        metadata: request.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToPayment(data);
    } catch (error: any) {
      console.error('Failed to create payment:', error);
      throw error;
    }
  }

  // Process payment
  async processPayment(paymentId: string): Promise<Payment> {
    try {
      const payment = await this.getPayment(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update status to processing
      await this.updatePaymentStatus(paymentId, PaymentStatus.PROCESSING);

      // Process with provider
      const result = await this.processProviderPayment(payment);

      // Update payment based on result
      if (result.success) {
        await this.updatePaymentStatus(paymentId, PaymentStatus.COMPLETED, {
          completed_at: new Date().toISOString(),
        });
      } else {
        await this.updatePaymentStatus(paymentId, PaymentStatus.FAILED, {
          failure_reason: result.error,
        });
      }

      return (await this.getPayment(paymentId))!;
    } catch (error: any) {
      console.error('Failed to process payment:', error);

      await this.updatePaymentStatus(paymentId, PaymentStatus.FAILED, {
        failure_reason: error.message,
      });

      throw error;
    }
  }

  // Authorize payment (capture later)
  async authorizePayment(request: PaymentRequest): Promise<Payment> {
    try {
      const payment = await this.createPayment(request);

      // Authorize with provider
      await this.authorizeProviderPayment(payment);

      // Update status
      await this.updatePaymentStatus(payment.id, PaymentStatus.AUTHORIZED);

      return (await this.getPayment(payment.id))!;
    } catch (error: any) {
      console.error('Failed to authorize payment:', error);
      throw error;
    }
  }

  // Capture authorized payment
  async capturePayment(paymentId: string, amount?: number): Promise<Payment> {
    try {
      const payment = await this.getPayment(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.AUTHORIZED) {
        throw new Error('Payment not authorized');
      }

      // Capture with provider
      await this.captureProviderPayment(payment, amount);

      // Update status
      await this.updatePaymentStatus(paymentId, PaymentStatus.COMPLETED, {
        completed_at: new Date().toISOString(),
        amount: amount || payment.amount,
      });

      return (await this.getPayment(paymentId))!;
    } catch (error: any) {
      console.error('Failed to capture payment:', error);
      throw error;
    }
  }

  // Cancel payment
  async cancelPayment(paymentId: string): Promise<Payment> {
    try {
      const payment = await this.getPayment(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Cancel with provider
      await this.cancelProviderPayment(payment);

      // Update status
      await this.updatePaymentStatus(paymentId, PaymentStatus.CANCELLED);

      return (await this.getPayment(paymentId))!;
    } catch (error: any) {
      console.error('Failed to cancel payment:', error);
      throw error;
    }
  }

  // Refund payment
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<Refund> {
    try {
      const payment = await this.getPayment(paymentId);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new Error('Payment not completed');
      }

      const refundAmount = amount || payment.amount;

      // Create refund with provider
      const providerRefundId = await this.createProviderRefund(
        payment,
        refundAmount,
        reason
      );

      // Save refund
      const refundData = {
        provider_refund_id: providerRefundId,
        payment_id: paymentId,
        amount: refundAmount,
        currency: payment.currency,
        reason,
        status: 'completed',
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('refunds')
        .insert(refundData)
        .select()
        .single();

      if (error) throw error;

      // Update payment status
      const newStatus =
        refundAmount < payment.amount
          ? PaymentStatus.PARTIALLY_REFUNDED
          : PaymentStatus.REFUNDED;

      await this.updatePaymentStatus(paymentId, newStatus);

      return {
        id: data.id,
        paymentId: data.payment_id,
        amount: data.amount,
        currency: data.currency,
        reason: data.reason,
        status: data.status,
        createdAt: data.created_at,
      };
    } catch (error: any) {
      console.error('Failed to refund payment:', error);
      throw error;
    }
  }

  // Get payment
  async getPayment(paymentId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error || !data) return null;

      return this.mapToPayment(data);
    } catch (error) {
      console.error('Failed to get payment:', error);
      return null;
    }
  }

  // List payments
  async listPayments(options: {
    customerId?: string;
    status?: PaymentStatus;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<Payment[]> {
    try {
      let query = supabase.from('payments').select('*');

      if (options.customerId) {
        query = query.eq('customer_id', options.customerId);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }

      query = query.order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToPayment);
    } catch (error) {
      console.error('Failed to list payments:', error);
      return [];
    }
  }

  // Save payment method
  async savePaymentMethod(data: Omit<PaymentMethodData, 'id' | 'createdAt'>): Promise<PaymentMethodData> {
    try {
      const methodData = {
        type: data.type,
        provider: data.provider,
        customer_id: data.customerId,
        last4: data.last4,
        brand: data.brand,
        expiry_month: data.expiryMonth,
        expiry_year: data.expiryYear,
        is_default: data.isDefault,
        metadata: data.metadata,
        created_at: new Date().toISOString(),
      };

      const { data: saved, error } = await supabase
        .from('payment_methods')
        .insert(methodData)
        .select()
        .single();

      if (error) throw error;

      return {
        id: saved.id,
        type: saved.type,
        provider: saved.provider,
        customerId: saved.customer_id,
        last4: saved.last4,
        brand: saved.brand,
        expiryMonth: saved.expiry_month,
        expiryYear: saved.expiry_year,
        isDefault: saved.is_default,
        metadata: saved.metadata,
        createdAt: saved.created_at,
      };
    } catch (error: any) {
      console.error('Failed to save payment method:', error);
      throw error;
    }
  }

  // Get customer payment methods
  async getPaymentMethods(customerId: string): Promise<PaymentMethodData[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false });

      if (error) throw error;

      return (data || []).map((method) => ({
        id: method.id,
        type: method.type,
        provider: method.provider,
        customerId: method.customer_id,
        last4: method.last4,
        brand: method.brand,
        expiryMonth: method.expiry_month,
        expiryYear: method.expiry_year,
        isDefault: method.is_default,
        metadata: method.metadata,
        createdAt: method.created_at,
      }));
    } catch (error) {
      console.error('Failed to get payment methods:', error);
      return [];
    }
  }

  // Delete payment method
  async deletePaymentMethod(methodId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      return !error;
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      return false;
    }
  }

  // Get payment statistics
  async getStats(options: {
    customerId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    successRate: number;
    totalRefunds: number;
    refundAmount: number;
    byStatus: Record<PaymentStatus, number>;
    byCurrency: Record<Currency, number>;
  }> {
    try {
      let query = supabase.from('payments').select('*');

      if (options.customerId) {
        query = query.eq('customer_id', options.customerId);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        totalPayments: data?.length || 0,
        totalAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        successRate: 0,
        totalRefunds: 0,
        refundAmount: 0,
        byStatus: {} as Record<PaymentStatus, number>,
        byCurrency: {} as Record<Currency, number>,
      };

      data?.forEach((payment) => {
        stats.totalAmount += payment.amount;

        if (payment.status === PaymentStatus.COMPLETED) {
          stats.successfulPayments++;
        } else if (payment.status === PaymentStatus.FAILED) {
          stats.failedPayments++;
        }

        stats.byStatus[payment.status as PaymentStatus] =
          (stats.byStatus[payment.status as PaymentStatus] || 0) + 1;

        stats.byCurrency[payment.currency as Currency] =
          (stats.byCurrency[payment.currency as Currency] || 0) + payment.amount;
      });

      stats.successRate =
        stats.totalPayments > 0
          ? (stats.successfulPayments / stats.totalPayments) * 100
          : 0;

      return stats;
    } catch (error) {
      console.error('Failed to get payment stats:', error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        successRate: 0,
        totalRefunds: 0,
        refundAmount: 0,
        byStatus: {} as any,
        byCurrency: {} as any,
      };
    }
  }

  // Provider-specific methods (mock implementations)
  private async createProviderPayment(request: PaymentRequest): Promise<string> {
    // Mock implementation - integrate with actual provider SDK
    return `${request.provider}_${Date.now()}`;
  }

  private async processProviderPayment(
    payment: Payment
  ): Promise<{ success: boolean; error?: string }> {
    // Mock implementation - integrate with actual provider SDK
    return { success: true };
  }

  private async authorizeProviderPayment(payment: Payment): Promise<void> {
    // Mock implementation - integrate with actual provider SDK
  }

  private async captureProviderPayment(
    payment: Payment,
    amount?: number
  ): Promise<void> {
    // Mock implementation - integrate with actual provider SDK
  }

  private async cancelProviderPayment(payment: Payment): Promise<void> {
    // Mock implementation - integrate with actual provider SDK
  }

  private async createProviderRefund(
    payment: Payment,
    amount: number,
    reason?: string
  ): Promise<string> {
    // Mock implementation - integrate with actual provider SDK
    return `refund_${Date.now()}`;
  }

  // Update payment status
  private async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    updates: Record<string, any> = {}
  ): Promise<void> {
    await supabase
      .from('payments')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...updates,
      })
      .eq('id', paymentId);
  }

  // Map database record to Payment
  private mapToPayment(data: any): Payment {
    return {
      id: data.id,
      providerId: data.provider_id,
      provider: data.provider,
      method: data.method,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      customerId: data.customer_id,
      description: data.description,
      metadata: data.metadata,
      failureReason: data.failure_reason,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
    };
  }
}

// Export singleton instance
export const paymentGateway = PaymentGateway.getInstance();

// Convenience functions
export const createPayment = (request: PaymentRequest) =>
  paymentGateway.createPayment(request);

export const processPayment = (paymentId: string) =>
  paymentGateway.processPayment(paymentId);

export const refundPayment = (paymentId: string, amount?: number, reason?: string) =>
  paymentGateway.refundPayment(paymentId, amount, reason);

export const getPayment = (paymentId: string) =>
  paymentGateway.getPayment(paymentId);

