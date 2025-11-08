import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum EventType {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',

  // Escrow events
  ESCROW_CREATED = 'escrow.created',
  ESCROW_FUNDED = 'escrow.funded',
  ESCROW_STARTED = 'escrow.started',
  ESCROW_COMPLETED = 'escrow.completed',
  ESCROW_DISPUTED = 'escrow.disputed',
  ESCROW_CANCELLED = 'escrow.cancelled',

  // Payment events
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Document events
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_VERIFIED = 'document.verified',
  DOCUMENT_REJECTED = 'document.rejected',

  // Notification events
  NOTIFICATION_SENT = 'notification.sent',
  NOTIFICATION_DELIVERED = 'notification.delivered',
  NOTIFICATION_FAILED = 'notification.failed',

  // System events
  SYSTEM_ERROR = 'system.error',
  SYSTEM_WARNING = 'system.warning',
  SYSTEM_INFO = 'system.info',
}

export enum EventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface Event {
  id: string;
  type: EventType;
  priority: EventPriority;
  timestamp: string;
  source: string;
  userId?: string;
  data: Record<string, any>;
  metadata?: {
    traceId?: string;
    correlationId?: string;
    version?: string;
    tags?: string[];
  };
}

export interface EventSubscription {
  id: string;
  eventTypes: EventType[];
  handler: EventHandler;
  filter?: EventFilter;
  options?: {
    retry?: number;
    timeout?: number;
    batchSize?: number;
  };
}

export type EventHandler = (event: Event) => Promise<void> | void;

export type EventFilter = (event: Event) => boolean;

export interface EventStream {
  subscribe(eventTypes: EventType[], handler: EventHandler): string;
  unsubscribe(subscriptionId: string): boolean;
  publish(event: Omit<Event, 'id' | 'timestamp'>): Promise<void>;
}

class EventStreamSystem implements EventStream {
  private static instance: EventStreamSystem;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventQueue: Event[] = [];
  private processing = false;
  private readonly BATCH_SIZE = 10;
  private readonly PROCESS_INTERVAL = 100; // ms

  private constructor() {
    this.startProcessing();
  }

  static getInstance(): EventStreamSystem {
    if (!EventStreamSystem.instance) {
      EventStreamSystem.instance = new EventStreamSystem();
    }
    return EventStreamSystem.instance;
  }

  // Publish event
  async publish(event: Omit<Event, 'id' | 'timestamp'>): Promise<void> {
    try {
      const fullEvent: Event = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...event,
      };

      // Add to queue
      this.eventQueue.push(fullEvent);

      // Store in database
      await this.storeEvent(fullEvent);

      // Notify subscribers (async)
      this.notifySubscribers(fullEvent);
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  // Subscribe to events
  subscribe(
    eventTypes: EventType[],
    handler: EventHandler,
    filter?: EventFilter,
    options?: EventSubscription['options']
  ): string {
    const subscriptionId = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const subscription: EventSubscription = {
      id: subscriptionId,
      eventTypes,
      handler,
      filter,
      options,
    };

    this.subscriptions.set(subscriptionId, subscription);

    return subscriptionId;
  }

  // Unsubscribe from events
  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  // Notify subscribers
  private async notifySubscribers(event: Event): Promise<void> {
    const matchingSubscriptions = Array.from(this.subscriptions.values()).filter(
      (sub) =>
        sub.eventTypes.includes(event.type) &&
        (!sub.filter || sub.filter(event))
    );

    for (const subscription of matchingSubscriptions) {
      try {
        const timeout = subscription.options?.timeout || 5000;
        await this.executeWithTimeout(subscription.handler(event), timeout);
      } catch (error) {
        console.error('Subscription handler error:', error);

        // Retry if configured
        if (subscription.options?.retry) {
          this.scheduleRetry(event, subscription);
        }
      }
    }
  }

  // Execute with timeout
  private executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Handler timeout')), timeout)
      ),
    ]);
  }

  // Schedule retry
  private async scheduleRetry(event: Event, subscription: EventSubscription): Promise<void> {
    const retries = subscription.options?.retry || 0;

    for (let i = 0; i < retries; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));

      try {
        await subscription.handler(event);
        return; // Success, no more retries needed
      } catch (error) {
        console.error(`Retry ${i + 1} failed:`, error);
      }
    }
  }

  // Store event in database
  private async storeEvent(event: Event): Promise<void> {
    try {
      await supabase.from('events').insert({
        id: event.id,
        type: event.type,
        priority: event.priority,
        timestamp: event.timestamp,
        source: event.source,
        user_id: event.userId,
        data: event.data,
        metadata: event.metadata,
      });
    } catch (error) {
      console.error('Failed to store event:', error);
    }
  }

  // Start processing queue
  private startProcessing(): void {
    if (this.processing) return;

    this.processing = true;

    setInterval(() => {
      this.processQueue();
    }, this.PROCESS_INTERVAL);
  }

  // Process event queue
  private async processQueue(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.BATCH_SIZE);

    // Process batch (can add additional processing here)
    for (const event of batch) {
      // Additional event processing if needed
    }
  }

  // Get events
  async getEvents(filter: {
    types?: EventType[];
    userId?: string;
    startDate?: string;
    endDate?: string;
    priority?: EventPriority;
    limit?: number;
  } = {}): Promise<Event[]> {
    try {
      let query = supabase.from('events').select('*');

      if (filter.types && filter.types.length > 0) {
        query = query.in('type', filter.types);
      }

      if (filter.userId) {
        query = query.eq('user_id', filter.userId);
      }

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate);
      }

      if (filter.priority) {
        query = query.eq('priority', filter.priority);
      }

      query = query.order('timestamp', { ascending: false });

      if (filter.limit) {
        query = query.limit(filter.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToEvent);
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  // Get event by ID
  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !data) return null;

      return this.mapToEvent(data);
    } catch (error) {
      console.error('Failed to get event:', error);
      return null;
    }
  }

  // Get event statistics
  async getStats(filter: {
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    total: number;
    byType: Record<EventType, number>;
    byPriority: Record<EventPriority, number>;
    byHour: Array<{ hour: string; count: number }>;
  }> {
    try {
      let query = supabase.from('events').select('type, priority, timestamp');

      if (filter.startDate) {
        query = query.gte('timestamp', filter.startDate);
      }

      if (filter.endDate) {
        query = query.lte('timestamp', filter.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        byType: {} as Record<EventType, number>,
        byPriority: {} as Record<EventPriority, number>,
        byHour: [] as Array<{ hour: string; count: number }>,
      };

      const hourCounts: Record<string, number> = {};

      data?.forEach((event) => {
        // Count by type
        stats.byType[event.type as EventType] =
          (stats.byType[event.type as EventType] || 0) + 1;

        // Count by priority
        stats.byPriority[event.priority as EventPriority] =
          (stats.byPriority[event.priority as EventPriority] || 0) + 1;

        // Count by hour
        const hour = new Date(event.timestamp).toISOString().slice(0, 13);
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      stats.byHour = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour, count }))
        .sort((a, b) => a.hour.localeCompare(b.hour));

      return stats;
    } catch (error) {
      console.error('Failed to get event stats:', error);
      return {
        total: 0,
        byType: {} as any,
        byPriority: {} as any,
        byHour: [],
      };
    }
  }

  // Replay events
  async replay(filter: {
    types?: EventType[];
    startDate?: string;
    endDate?: string;
  }): Promise<number> {
    try {
      const events = await this.getEvents({
        types: filter.types,
        startDate: filter.startDate,
        endDate: filter.endDate,
      });

      for (const event of events) {
        await this.notifySubscribers(event);
      }

      return events.length;
    } catch (error) {
      console.error('Failed to replay events:', error);
      return 0;
    }
  }

  // Create event stream
  createStream(filter?: {
    types?: EventType[];
    userId?: string;
    priority?: EventPriority;
  }): EventStreamReader {
    return new EventStreamReader(this, filter);
  }

  // Clean up old events
  async cleanup(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('events')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup events:', error);
      return 0;
    }
  }

  // Map database record to Event
  private mapToEvent(data: any): Event {
    return {
      id: data.id,
      type: data.type,
      priority: data.priority,
      timestamp: data.timestamp,
      source: data.source,
      userId: data.user_id,
      data: data.data,
      metadata: data.metadata,
    };
  }
}

// Event stream reader for streaming events
class EventStreamReader {
  private subscriptionId?: string;

  constructor(
    private system: EventStreamSystem,
    private filter?: {
      types?: EventType[];
      userId?: string;
      priority?: EventPriority;
    }
  ) {}

  // Read events as stream
  async *read(): AsyncGenerator<Event> {
    const events: Event[] = [];
    let resolver: ((event: Event) => void) | null = null;

    // Subscribe to new events
    this.subscriptionId = this.system.subscribe(
      this.filter?.types || Object.values(EventType),
      (event) => {
        if (this.matchesFilter(event)) {
          if (resolver) {
            resolver(event);
            resolver = null;
          } else {
            events.push(event);
          }
        }
      }
    );

    try {
      while (true) {
        // Yield buffered events first
        while (events.length > 0) {
          yield events.shift()!;
        }

        // Wait for next event
        const event = await new Promise<Event>((resolve) => {
          resolver = resolve;
        });

        yield event;
      }
    } finally {
      if (this.subscriptionId) {
        this.system.unsubscribe(this.subscriptionId);
      }
    }
  }

  // Check if event matches filter
  private matchesFilter(event: Event): boolean {
    if (this.filter?.userId && event.userId !== this.filter.userId) {
      return false;
    }

    if (this.filter?.priority && event.priority !== this.filter.priority) {
      return false;
    }

    return true;
  }

  // Close stream
  close(): void {
    if (this.subscriptionId) {
      this.system.unsubscribe(this.subscriptionId);
      this.subscriptionId = undefined;
    }
  }
}

// Export singleton instance
export const eventStream = EventStreamSystem.getInstance();

// Convenience functions
export const publishEvent = (event: Omit<Event, 'id' | 'timestamp'>) =>
  eventStream.publish(event);

export const subscribeToEvents = (
  eventTypes: EventType[],
  handler: EventHandler,
  filter?: EventFilter
) => eventStream.subscribe(eventTypes, handler, filter);

export const unsubscribeFromEvents = (subscriptionId: string) =>
  eventStream.unsubscribe(subscriptionId);

export const getEvents = (filter?: any) => eventStream.getEvents(filter);

export const createEventStream = (filter?: any) => eventStream.createStream(filter);

// Helper to create typed events
export const createEvent = {
  userCreated: (userId: string, data: Record<string, any>) =>
    publishEvent({
      type: EventType.USER_CREATED,
      priority: EventPriority.MEDIUM,
      source: 'user-service',
      userId,
      data,
    }),

  escrowCreated: (escrowId: string, userId: string, data: Record<string, any>) =>
    publishEvent({
      type: EventType.ESCROW_CREATED,
      priority: EventPriority.HIGH,
      source: 'escrow-service',
      userId,
      data: { escrowId, ...data },
    }),

  paymentCompleted: (paymentId: string, userId: string, amount: number) =>
    publishEvent({
      type: EventType.PAYMENT_COMPLETED,
      priority: EventPriority.HIGH,
      source: 'payment-service',
      userId,
      data: { paymentId, amount },
    }),

  documentVerified: (documentId: string, userId: string) =>
    publishEvent({
      type: EventType.DOCUMENT_VERIFIED,
      priority: EventPriority.MEDIUM,
      source: 'document-service',
      userId,
      data: { documentId },
    }),
};

