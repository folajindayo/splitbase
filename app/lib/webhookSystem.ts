import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Webhook event types
export enum WebhookEventType {
  ESCROW_CREATED = 'escrow.created',
  ESCROW_FUNDED = 'escrow.funded',
  ESCROW_RELEASED = 'escrow.released',
  ESCROW_DISPUTED = 'escrow.disputed',
  ESCROW_RESOLVED = 'escrow.resolved',
  ESCROW_CANCELLED = 'escrow.cancelled',
  ESCROW_EXPIRED = 'escrow.expired',
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_SENT = 'payment.sent',
  PAYMENT_FAILED = 'payment.failed',
  USER_REGISTERED = 'user.registered',
  USER_VERIFIED = 'user.verified',
  DISPUTE_OPENED = 'dispute.opened',
  DISPUTE_UPDATED = 'dispute.updated',
  DISPUTE_CLOSED = 'dispute.closed',
  REFUND_ISSUED = 'refund.issued',
  MILESTONE_COMPLETED = 'milestone.completed',
}

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  active: boolean;
  description?: string;
  headers?: Record<string, string>;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  payload: WebhookPayload;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

class WebhookSystem {
  private static instance: WebhookSystem;
  private deliveryQueue: WebhookDelivery[] = [];
  private isProcessing = false;

  private constructor() {}

  static getInstance(): WebhookSystem {
    if (!WebhookSystem.instance) {
      WebhookSystem.instance = new WebhookSystem();
    }
    return WebhookSystem.instance;
  }

  // Register a new webhook endpoint
  async registerEndpoint(
    userId: string,
    url: string,
    events: WebhookEventType[],
    options: {
      description?: string;
      headers?: Record<string, string>;
      retryPolicy?: {
        maxRetries?: number;
        retryDelay?: number;
        exponentialBackoff?: boolean;
      };
    } = {}
  ): Promise<WebhookEndpoint> {
    // Generate a secure secret for webhook verification
    const secret = this.generateSecret();

    const endpoint: Omit<WebhookEndpoint, 'id'> = {
      url,
      secret,
      events,
      active: true,
      description: options.description,
      headers: options.headers,
      retryPolicy: {
        maxRetries: options.retryPolicy?.maxRetries || 3,
        retryDelay: options.retryPolicy?.retryDelay || 60000, // 1 minute
        exponentialBackoff: options.retryPolicy?.exponentialBackoff ?? true,
      },
    };

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        user_id: userId,
        ...endpoint,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update webhook endpoint
  async updateEndpoint(
    endpointId: string,
    updates: Partial<Omit<WebhookEndpoint, 'id' | 'secret'>>
  ): Promise<WebhookEndpoint> {
    const { data, error } = await supabase
      .from('webhook_endpoints')
      .update(updates)
      .eq('id', endpointId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete webhook endpoint
  async deleteEndpoint(endpointId: string): Promise<void> {
    const { error } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', endpointId);

    if (error) throw error;
  }

  // Get all endpoints for a user
  async getEndpoints(userId: string): Promise<WebhookEndpoint[]> {
    const { data, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Trigger a webhook event
  async triggerEvent(
    event: WebhookEventType,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };

    // Get all active endpoints subscribed to this event
    const { data: endpoints, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('active', true)
      .contains('events', [event]);

    if (error) {
      console.error('Error fetching webhook endpoints:', error);
      return;
    }

    if (!endpoints || endpoints.length === 0) {
      return;
    }

    // Create delivery records for each endpoint
    for (const endpoint of endpoints) {
      await this.createDelivery(endpoint, payload);
    }

    // Start processing the queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Create a webhook delivery
  private async createDelivery(
    endpoint: WebhookEndpoint,
    payload: WebhookPayload
  ): Promise<void> {
    const delivery: Omit<WebhookDelivery, 'id'> = {
      endpointId: endpoint.id,
      payload,
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('webhook_deliveries')
      .insert(delivery)
      .select()
      .single();

    if (error) {
      console.error('Error creating webhook delivery:', error);
      return;
    }

    this.deliveryQueue.push(data);
  }

  // Process the delivery queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.deliveryQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.deliveryQueue.length > 0) {
      const delivery = this.deliveryQueue.shift()!;
      await this.deliverWebhook(delivery);
    }

    this.isProcessing = false;

    // Check for failed deliveries that need retry
    await this.retryFailedDeliveries();
  }

  // Deliver a single webhook
  private async deliverWebhook(delivery: WebhookDelivery): Promise<void> {
    // Get endpoint details
    const { data: endpoint, error: endpointError } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', delivery.endpointId)
      .single();

    if (endpointError || !endpoint) {
      await this.updateDeliveryStatus(delivery.id, 'failed', {
        error: 'Endpoint not found',
      });
      return;
    }

    try {
      // Generate signature for webhook verification
      const signature = this.generateSignature(
        delivery.payload,
        endpoint.secret
      );

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': delivery.payload.event,
        'X-Webhook-Timestamp': delivery.payload.timestamp,
        'X-Webhook-Delivery-Id': delivery.id,
        ...endpoint.headers,
      };

      // Send the webhook
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
      });

      const responseBody = await response.text();

      if (response.ok) {
        // Success
        await this.updateDeliveryStatus(delivery.id, 'success', {
          responseStatus: response.status,
          responseBody,
          completedAt: new Date().toISOString(),
        });
      } else {
        // Failed
        await this.handleFailedDelivery(delivery, endpoint, {
          responseStatus: response.status,
          responseBody,
          error: `HTTP ${response.status}: ${response.statusText}`,
        });
      }
    } catch (error: any) {
      // Network or other error
      await this.handleFailedDelivery(delivery, endpoint, {
        error: error.message || 'Unknown error',
      });
    }
  }

  // Handle failed webhook delivery
  private async handleFailedDelivery(
    delivery: WebhookDelivery,
    endpoint: WebhookEndpoint,
    errorInfo: {
      responseStatus?: number;
      responseBody?: string;
      error: string;
    }
  ): Promise<void> {
    const attempts = delivery.attempts + 1;
    const maxRetries = endpoint.retryPolicy?.maxRetries || 3;

    if (attempts < maxRetries) {
      // Schedule retry
      const retryDelay = endpoint.retryPolicy?.retryDelay || 60000;
      const backoffMultiplier = endpoint.retryPolicy?.exponentialBackoff
        ? Math.pow(2, attempts)
        : 1;
      const nextRetryAt = new Date(
        Date.now() + retryDelay * backoffMultiplier
      ).toISOString();

      await this.updateDeliveryStatus(delivery.id, 'retrying', {
        ...errorInfo,
        attempts,
        lastAttemptAt: new Date().toISOString(),
        nextRetryAt,
      });
    } else {
      // Max retries reached
      await this.updateDeliveryStatus(delivery.id, 'failed', {
        ...errorInfo,
        attempts,
        lastAttemptAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    }
  }

  // Update delivery status
  private async updateDeliveryStatus(
    deliveryId: string,
    status: WebhookDelivery['status'],
    updates: Partial<WebhookDelivery>
  ): Promise<void> {
    const { error } = await supabase
      .from('webhook_deliveries')
      .update({
        status,
        ...updates,
      })
      .eq('id', deliveryId);

    if (error) {
      console.error('Error updating webhook delivery:', error);
    }
  }

  // Retry failed deliveries
  private async retryFailedDeliveries(): Promise<void> {
    const { data: deliveries, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('status', 'retrying')
      .lte('next_retry_at', new Date().toISOString())
      .limit(100);

    if (error || !deliveries || deliveries.length === 0) {
      return;
    }

    for (const delivery of deliveries) {
      await this.deliverWebhook(delivery);
    }
  }

  // Generate webhook signature for verification
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  // Generate a secure secret
  private generateSecret(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  // Verify webhook signature (for consumers)
  static verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Get delivery history for an endpoint
  async getDeliveryHistory(
    endpointId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: WebhookDelivery['status'];
    } = {}
  ): Promise<WebhookDelivery[]> {
    let query = supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('endpoint_id', endpointId)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  // Get delivery statistics
  async getDeliveryStats(endpointId: string): Promise<{
    total: number;
    success: number;
    failed: number;
    pending: number;
    successRate: number;
  }> {
    const { data, error } = await supabase
      .from('webhook_deliveries')
      .select('status')
      .eq('endpoint_id', endpointId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      success: 0,
      failed: 0,
      pending: 0,
      successRate: 0,
    };

    if (data) {
      stats.success = data.filter(d => d.status === 'success').length;
      stats.failed = data.filter(d => d.status === 'failed').length;
      stats.pending = data.filter(
        d => d.status === 'pending' || d.status === 'retrying'
      ).length;
      stats.successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
    }

    return stats;
  }

  // Replay a failed webhook
  async replayWebhook(deliveryId: string): Promise<void> {
    const { data: delivery, error } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('id', deliveryId)
      .single();

    if (error || !delivery) {
      throw new Error('Delivery not found');
    }

    // Reset delivery status
    await this.updateDeliveryStatus(deliveryId, 'pending', {
      attempts: 0,
      lastAttemptAt: undefined,
      nextRetryAt: undefined,
      error: undefined,
    });

    // Add to queue
    this.deliveryQueue.push({ ...delivery, status: 'pending', attempts: 0 });

    // Process queue
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
}

// Export singleton instance
export const webhookSystem = WebhookSystem.getInstance();

// Convenience functions
export const triggerEscrowCreated = (escrowData: Record<string, any>) =>
  webhookSystem.triggerEvent(WebhookEventType.ESCROW_CREATED, escrowData);

export const triggerEscrowFunded = (escrowData: Record<string, any>) =>
  webhookSystem.triggerEvent(WebhookEventType.ESCROW_FUNDED, escrowData);

export const triggerEscrowReleased = (escrowData: Record<string, any>) =>
  webhookSystem.triggerEvent(WebhookEventType.ESCROW_RELEASED, escrowData);

export const triggerEscrowDisputed = (disputeData: Record<string, any>) =>
  webhookSystem.triggerEvent(WebhookEventType.ESCROW_DISPUTED, disputeData);

export const triggerPaymentReceived = (paymentData: Record<string, any>) =>
  webhookSystem.triggerEvent(WebhookEventType.PAYMENT_RECEIVED, paymentData);

export const triggerPaymentFailed = (paymentData: Record<string, any>) =>
  webhookSystem.triggerEvent(WebhookEventType.PAYMENT_FAILED, paymentData);

