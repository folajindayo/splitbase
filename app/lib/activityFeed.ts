import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum ActivityType {
  // User activities
  USER_REGISTERED = 'user.registered',
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_PROFILE_UPDATED = 'user.profile_updated',
  USER_PASSWORD_CHANGED = 'user.password_changed',

  // Escrow activities
  ESCROW_CREATED = 'escrow.created',
  ESCROW_FUNDED = 'escrow.funded',
  ESCROW_STARTED = 'escrow.started',
  ESCROW_MILESTONE_COMPLETED = 'escrow.milestone_completed',
  ESCROW_RELEASED = 'escrow.released',
  ESCROW_COMPLETED = 'escrow.completed',
  ESCROW_CANCELLED = 'escrow.cancelled',

  // Payment activities
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  REFUND_ISSUED = 'refund.issued',

  // Document activities
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_VERIFIED = 'document.verified',
  DOCUMENT_REJECTED = 'document.rejected',

  // Dispute activities
  DISPUTE_OPENED = 'dispute.opened',
  DISPUTE_EVIDENCE_SUBMITTED = 'dispute.evidence_submitted',
  DISPUTE_RESOLVED = 'dispute.resolved',

  // Transaction activities
  TRANSACTION_CREATED = 'transaction.created',
  TRANSFER_COMPLETED = 'transfer.completed',
  WITHDRAWAL_COMPLETED = 'withdrawal.completed',

  // System activities
  NOTIFICATION_SENT = 'notification.sent',
  REPORT_GENERATED = 'report.generated',
  SETTINGS_UPDATED = 'settings.updated',
}

export enum ActivityVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  PARTICIPANTS = 'participants',
  ADMIN = 'admin',
}

export enum ActivityPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Activity {
  id: string;
  type: ActivityType;
  actor: {
    id: string;
    name: string;
    avatar?: string;
    type: 'user' | 'system';
  };
  action: string;
  object?: {
    id: string;
    type: string;
    name: string;
  };
  target?: {
    id: string;
    type: string;
    name: string;
  };
  description: string;
  visibility: ActivityVisibility;
  priority: ActivityPriority;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  read: boolean;
  tags?: string[];
}

export interface ActivityFeedOptions {
  userId?: string;
  types?: ActivityType[];
  visibility?: ActivityVisibility[];
  priority?: ActivityPriority[];
  startDate?: string;
  endDate?: string;
  tags?: string[];
  read?: boolean;
  limit?: number;
  offset?: number;
}

export interface ActivityGroup {
  date: string;
  activities: Activity[];
  count: number;
}

export interface ActivityStatistics {
  total: number;
  byType: Record<ActivityType, number>;
  byPriority: Record<ActivityPriority, number>;
  recentActivity: Activity[];
  mostActiveUsers: Array<{
    userId: string;
    name: string;
    count: number;
  }>;
  timeline: Array<{
    date: string;
    count: number;
  }>;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ActivityFilter {
  actors?: string[];
  objects?: Array<{ type: string; id: string }>;
  excludeTypes?: ActivityType[];
  onlyUnread?: boolean;
}

class ActivityFeedSystem {
  private static instance: ActivityFeedSystem;

  private constructor() {}

  static getInstance(): ActivityFeedSystem {
    if (!ActivityFeedSystem.instance) {
      ActivityFeedSystem.instance = new ActivityFeedSystem();
    }
    return ActivityFeedSystem.instance;
  }

  // Create activity
  async create(activity: {
    type: ActivityType;
    actor: Activity['actor'];
    action: string;
    object?: Activity['object'];
    target?: Activity['target'];
    description: string;
    visibility?: ActivityVisibility;
    priority?: ActivityPriority;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    tags?: string[];
  }): Promise<Activity> {
    try {
      const activityData = {
        type: activity.type,
        actor: activity.actor,
        action: activity.action,
        object: activity.object,
        target: activity.target,
        description: activity.description,
        visibility: activity.visibility || ActivityVisibility.PARTICIPANTS,
        priority: activity.priority || ActivityPriority.NORMAL,
        metadata: activity.metadata,
        ip_address: activity.ipAddress,
        user_agent: activity.userAgent,
        timestamp: new Date().toISOString(),
        read: false,
        tags: activity.tags || [],
      };

      const { data, error } = await supabase
        .from('activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;

      return this.mapToActivity(data);
    } catch (error: any) {
      console.error('Failed to create activity:', error);
      throw error;
    }
  }

  // Get activity feed
  async getFeed(options: ActivityFeedOptions = {}): Promise<Activity[]> {
    try {
      let query = supabase.from('activities').select('*');

      if (options.userId) {
        query = query.or(
          `actor->>id.eq.${options.userId},target->>id.eq.${options.userId}`
        );
      }

      if (options.types && options.types.length > 0) {
        query = query.in('type', options.types);
      }

      if (options.visibility && options.visibility.length > 0) {
        query = query.in('visibility', options.visibility);
      }

      if (options.priority && options.priority.length > 0) {
        query = query.in('priority', options.priority);
      }

      if (options.startDate) {
        query = query.gte('timestamp', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('timestamp', options.endDate);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.contains('tags', options.tags);
      }

      if (options.read !== undefined) {
        query = query.eq('read', options.read);
      }

      query = query.order('timestamp', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToActivity);
    } catch (error) {
      console.error('Failed to get activity feed:', error);
      return [];
    }
  }

  // Get grouped feed
  async getGroupedFeed(options: ActivityFeedOptions = {}): Promise<ActivityGroup[]> {
    const activities = await this.getFeed(options);

    const groups: Record<string, Activity[]> = {};

    activities.forEach((activity) => {
      const date = activity.timestamp.split('T')[0];

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(activity);
    });

    return Object.entries(groups)
      .map(([date, activities]) => ({
        date,
        activities,
        count: activities.length,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  // Get activity
  async get(activityId: string): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (error || !data) return null;

      return this.mapToActivity(data);
    } catch (error) {
      console.error('Failed to get activity:', error);
      return null;
    }
  }

  // Mark as read
  async markAsRead(activityIds: string | string[]): Promise<boolean> {
    try {
      const ids = Array.isArray(activityIds) ? activityIds : [activityIds];

      const { error } = await supabase
        .from('activities')
        .update({ read: true })
        .in('id', ids);

      return !error;
    } catch (error) {
      console.error('Failed to mark as read:', error);
      return false;
    }
  }

  // Mark all as read
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ read: true })
        .or(`actor->>id.eq.${userId},target->>id.eq.${userId}`)
        .eq('read', false);

      return !error;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      return false;
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .or(`actor->>id.eq.${userId},target->>id.eq.${userId}`)
        .eq('read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Get statistics
  async getStatistics(options: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ActivityStatistics> {
    try {
      const activities = await this.getFeed(options);

      const stats: ActivityStatistics = {
        total: activities.length,
        byType: {} as Record<ActivityType, number>,
        byPriority: {} as Record<ActivityPriority, number>,
        recentActivity: activities.slice(0, 10),
        mostActiveUsers: [],
        timeline: [],
      };

      const userCounts: Record<string, { name: string; count: number }> = {};
      const dailyCounts: Record<string, number> = {};

      activities.forEach((activity) => {
        // Count by type
        stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;

        // Count by priority
        stats.byPriority[activity.priority] =
          (stats.byPriority[activity.priority] || 0) + 1;

        // Count by user
        if (activity.actor.type === 'user') {
          if (!userCounts[activity.actor.id]) {
            userCounts[activity.actor.id] = {
              name: activity.actor.name,
              count: 0,
            };
          }
          userCounts[activity.actor.id].count++;
        }

        // Count by day
        const date = activity.timestamp.split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      // Most active users
      stats.mostActiveUsers = Object.entries(userCounts)
        .map(([userId, data]) => ({
          userId,
          name: data.name,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Timeline
      stats.timeline = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return stats;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        total: 0,
        byType: {} as any,
        byPriority: {} as any,
        recentActivity: [],
        mostActiveUsers: [],
        timeline: [],
      };
    }
  }

  // Create timeline event
  async createTimelineEvent(event: Omit<TimelineEvent, 'id'>): Promise<TimelineEvent> {
    try {
      const eventData = {
        title: event.title,
        description: event.description,
        timestamp: event.timestamp,
        icon: event.icon,
        color: event.color,
        metadata: event.metadata,
      };

      const { data, error } = await supabase
        .from('timeline_events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        timestamp: data.timestamp,
        icon: data.icon,
        color: data.color,
        metadata: data.metadata,
      };
    } catch (error: any) {
      console.error('Failed to create timeline event:', error);
      throw error;
    }
  }

  // Get timeline
  async getTimeline(options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<TimelineEvent[]> {
    try {
      let query = supabase.from('timeline_events').select('*');

      if (options.startDate) {
        query = query.gte('timestamp', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('timestamp', options.endDate);
      }

      query = query.order('timestamp', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        timestamp: event.timestamp,
        icon: event.icon,
        color: event.color,
        metadata: event.metadata,
      }));
    } catch (error) {
      console.error('Failed to get timeline:', error);
      return [];
    }
  }

  // Delete old activities
  async cleanup(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('activities')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup activities:', error);
      return 0;
    }
  }

  // Subscribe to real-time activities
  subscribeToFeed(
    userId: string,
    callback: (activity: Activity) => void
  ): () => void {
    const subscription = supabase
      .channel('activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        (payload) => {
          const activity = this.mapToActivity(payload.new);

          // Check if activity is relevant to user
          if (
            activity.actor.id === userId ||
            activity.target?.id === userId ||
            activity.visibility === ActivityVisibility.PUBLIC
          ) {
            callback(activity);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  // Map database record to Activity
  private mapToActivity(data: any): Activity {
    return {
      id: data.id,
      type: data.type,
      actor: data.actor,
      action: data.action,
      object: data.object,
      target: data.target,
      description: data.description,
      visibility: data.visibility,
      priority: data.priority,
      metadata: data.metadata,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      timestamp: data.timestamp,
      read: data.read,
      tags: data.tags || [],
    };
  }

  // Helper to create common activities
  helpers = {
    userRegistered: (userId: string, name: string) =>
      this.create({
        type: ActivityType.USER_REGISTERED,
        actor: { id: userId, name, type: 'user' },
        action: 'registered',
        description: `${name} joined the platform`,
        visibility: ActivityVisibility.PUBLIC,
        priority: ActivityPriority.NORMAL,
      }),

    escrowCreated: (userId: string, userName: string, escrowId: string, escrowTitle: string) =>
      this.create({
        type: ActivityType.ESCROW_CREATED,
        actor: { id: userId, name: userName, type: 'user' },
        action: 'created',
        object: { id: escrowId, type: 'escrow', name: escrowTitle },
        description: `${userName} created escrow "${escrowTitle}"`,
        visibility: ActivityVisibility.PARTICIPANTS,
        priority: ActivityPriority.HIGH,
      }),

    paymentCompleted: (userId: string, userName: string, amount: number, currency: string) =>
      this.create({
        type: ActivityType.PAYMENT_COMPLETED,
        actor: { id: userId, name: userName, type: 'user' },
        action: 'completed payment',
        description: `${userName} completed payment of ${amount} ${currency}`,
        visibility: ActivityVisibility.PRIVATE,
        priority: ActivityPriority.HIGH,
        metadata: { amount, currency },
      }),

    documentVerified: (documentId: string, documentName: string, userId: string) =>
      this.create({
        type: ActivityType.DOCUMENT_VERIFIED,
        actor: { id: 'system', name: 'System', type: 'system' },
        action: 'verified',
        object: { id: documentId, type: 'document', name: documentName },
        target: { id: userId, type: 'user', name: '' },
        description: `Document "${documentName}" has been verified`,
        visibility: ActivityVisibility.PRIVATE,
        priority: ActivityPriority.NORMAL,
      }),
  };
}

// Export singleton instance
export const activityFeed = ActivityFeedSystem.getInstance();

// Convenience functions
export const createActivity = (activity: any) => activityFeed.create(activity);

export const getActivityFeed = (options?: ActivityFeedOptions) =>
  activityFeed.getFeed(options);

export const getGroupedFeed = (options?: ActivityFeedOptions) =>
  activityFeed.getGroupedFeed(options);

export const markActivitiesAsRead = (activityIds: string | string[]) =>
  activityFeed.markAsRead(activityIds);

export const getUnreadCount = (userId: string) => activityFeed.getUnreadCount(userId);

export const subscribeToActivities = (userId: string, callback: (activity: Activity) => void) =>
  activityFeed.subscribeToFeed(userId, callback);

