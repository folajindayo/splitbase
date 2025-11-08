import { createClient } from '@supabase/supabase-js';
import { emailTemplates } from './emailTemplates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationCategory {
  ACCOUNT = 'account',
  TRANSACTION = 'transaction',
  ESCROW = 'escrow',
  PAYMENT = 'payment',
  SECURITY = 'security',
  MARKETING = 'marketing',
  SYSTEM = 'system',
}

export interface NotificationTemplate {
  id: string;
  name: string;
  category: NotificationCategory;
  title: string;
  body: string;
  channels: NotificationType[];
  variables: string[];
}

export interface NotificationOptions {
  userId: string;
  type: NotificationType | NotificationType[];
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  actionUrl?: string;
  expiresAt?: Date;
  scheduledFor?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

class NotificationSystem {
  private static instance: NotificationSystem;
  private templates: Map<string, NotificationTemplate> = new Map();

  private constructor() {}

  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem();
    }
    return NotificationSystem.instance;
  }

  // Register notification template
  registerTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  // Send notification
  async send(options: NotificationOptions): Promise<string[]> {
    try {
      const notificationIds: string[] = [];
      const types = Array.isArray(options.type) ? options.type : [options.type];

      // Check user preferences
      const preferences = await this.getUserPreferences(options.userId);

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        // Schedule for later
        options.scheduledFor = this.getNextAvailableTime(preferences);
      }

      for (const type of types) {
        // Check if channel is enabled
        if (!this.isChannelEnabled(type, preferences, options.category)) {
          continue;
        }

        // Send to appropriate channel
        let notificationId: string | null = null;

        switch (type) {
          case NotificationType.EMAIL:
            notificationId = await this.sendEmail(options);
            break;
          case NotificationType.SMS:
            notificationId = await this.sendSMS(options);
            break;
          case NotificationType.PUSH:
            notificationId = await this.sendPush(options);
            break;
          case NotificationType.IN_APP:
            notificationId = await this.sendInApp(options);
            break;
          case NotificationType.WEBHOOK:
            notificationId = await this.sendWebhook(options);
            break;
        }

        if (notificationId) {
          notificationIds.push(notificationId);
        }
      }

      return notificationIds;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  // Send using template
  async sendFromTemplate(
    templateId: string,
    userId: string,
    variables: Record<string, any>
  ): Promise<string[]> {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Replace variables in title and body
    let title = template.title;
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      title = title.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    return this.send({
      userId,
      type: template.channels,
      category: template.category,
      title,
      message: body,
      data: variables,
    });
  }

  // Send email notification
  private async sendEmail(options: NotificationOptions): Promise<string | null> {
    try {
      // Get user email
      const { data: user } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', options.userId)
        .single();

      if (!user || !user.email) {
        return null;
      }

      // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
      console.log(`Sending email to ${user.email}: ${options.title}`);

      // Log notification
      return this.logNotification({
        ...options,
        type: NotificationType.EMAIL,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      return null;
    }
  }

  // Send SMS notification
  private async sendSMS(options: NotificationOptions): Promise<string | null> {
    try {
      // Get user phone
      const { data: user } = await supabase
        .from('users')
        .select('phone')
        .eq('id', options.userId)
        .single();

      if (!user || !user.phone) {
        return null;
      }

      // TODO: Integrate with SMS service (Twilio, etc.)
      console.log(`Sending SMS to ${user.phone}: ${options.message}`);

      // Log notification
      return this.logNotification({
        ...options,
        type: NotificationType.SMS,
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return null;
    }
  }

  // Send push notification
  private async sendPush(options: NotificationOptions): Promise<string | null> {
    try {
      // Get user push tokens
      const { data: tokens } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', options.userId)
        .eq('active', true);

      if (!tokens || tokens.length === 0) {
        return null;
      }

      // TODO: Integrate with push service (FCM, APNS, etc.)
      console.log(`Sending push to ${tokens.length} devices: ${options.title}`);

      // Log notification
      return this.logNotification({
        ...options,
        type: NotificationType.PUSH,
      });
    } catch (error) {
      console.error('Failed to send push:', error);
      return null;
    }
  }

  // Send in-app notification
  private async sendInApp(options: NotificationOptions): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: options.userId,
          type: NotificationType.IN_APP,
          category: options.category,
          title: options.title,
          message: options.message,
          data: options.data,
          priority: options.priority || NotificationPriority.NORMAL,
          read: false,
          action_url: options.actionUrl,
          expires_at: options.expiresAt?.toISOString(),
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
      return null;
    }
  }

  // Send webhook notification
  private async sendWebhook(options: NotificationOptions): Promise<string | null> {
    try {
      // Get user webhook URL
      const { data: webhookConfig } = await supabase
        .from('user_webhooks')
        .select('url')
        .eq('user_id', options.userId)
        .eq('active', true)
        .single();

      if (!webhookConfig) {
        return null;
      }

      // Send webhook
      await fetch(webhookConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'notification',
          category: options.category,
          title: options.title,
          message: options.message,
          data: options.data,
          timestamp: new Date().toISOString(),
        }),
      });

      // Log notification
      return this.logNotification({
        ...options,
        type: NotificationType.WEBHOOK,
      });
    } catch (error) {
      console.error('Failed to send webhook:', error);
      return null;
    }
  }

  // Log notification
  private async logNotification(options: NotificationOptions & { type: NotificationType }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('notification_log')
        .insert({
          user_id: options.userId,
          type: options.type,
          category: options.category,
          title: options.title,
          message: options.message,
          data: options.data,
          priority: options.priority || NotificationPriority.NORMAL,
          sent_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Failed to log notification:', error);
      return '';
    }
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      category?: NotificationCategory;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      if (options.unreadOnly) {
        query = query.eq('read', false);
      }

      if (options.category) {
        query = query.eq('category', options.category);
      }

      query = query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50);

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

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
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('read', false);

      return !error;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      return false;
    }
  }

  // Delete notification
  async delete(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return (
        data || {
          userId,
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
          categories: {
            [NotificationCategory.ACCOUNT]: true,
            [NotificationCategory.TRANSACTION]: true,
            [NotificationCategory.ESCROW]: true,
            [NotificationCategory.PAYMENT]: true,
            [NotificationCategory.SECURITY]: true,
            [NotificationCategory.MARKETING]: false,
            [NotificationCategory.SYSTEM]: true,
          },
        }
      );
    } catch (error) {
      console.error('Failed to get preferences:', error);
      throw error;
    }
  }

  // Update user preferences
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      return !error;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return false;
    }
  }

  // Check if channel is enabled
  private isChannelEnabled(
    type: NotificationType,
    preferences: NotificationPreferences,
    category: NotificationCategory
  ): boolean {
    // Check category preference
    if (!preferences.categories[category]) {
      return false;
    }

    // Check channel preference
    switch (type) {
      case NotificationType.EMAIL:
        return preferences.emailEnabled;
      case NotificationType.SMS:
        return preferences.smsEnabled;
      case NotificationType.PUSH:
        return preferences.pushEnabled;
      case NotificationType.IN_APP:
        return true; // Always enabled
      case NotificationType.WEBHOOK:
        return true; // Always enabled if configured
      default:
        return false;
    }
  }

  // Check if in quiet hours
  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);

    const quietStart = startHour * 60 + startMin;
    const quietEnd = endHour * 60 + endMin;

    if (quietStart <= quietEnd) {
      return currentTime >= quietStart && currentTime < quietEnd;
    } else {
      // Quiet hours span midnight
      return currentTime >= quietStart || currentTime < quietEnd;
    }
  }

  // Get next available time
  private getNextAvailableTime(preferences: NotificationPreferences): Date {
    if (!preferences.quietHoursEnd) {
      return new Date();
    }

    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    const nextTime = new Date();
    nextTime.setHours(endHour, endMin, 0, 0);

    // If end time is in the past today, schedule for tomorrow
    if (nextTime <= new Date()) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  }

  // Batch send notifications
  async sendBatch(notifications: NotificationOptions[]): Promise<string[][]> {
    const results: string[][] = [];

    for (const notification of notifications) {
      const ids = await this.send(notification);
      results.push(ids);
    }

    return results;
  }

  // Clean up old notifications
  async cleanup(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup notifications:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const notifications = NotificationSystem.getInstance();

// Register common templates
notifications.registerTemplate({
  id: 'welcome',
  name: 'Welcome Email',
  category: NotificationCategory.ACCOUNT,
  title: 'Welcome to {{appName}}!',
  body: 'Hi {{userName}}, welcome to our platform!',
  channels: [NotificationType.EMAIL, NotificationType.IN_APP],
  variables: ['appName', 'userName'],
});

notifications.registerTemplate({
  id: 'escrow_created',
  name: 'Escrow Created',
  category: NotificationCategory.ESCROW,
  title: 'New escrow transaction created',
  body: 'An escrow transaction of {{amount}} has been created.',
  channels: [NotificationType.EMAIL, NotificationType.PUSH, NotificationType.IN_APP],
  variables: ['amount', 'escrowId'],
});

// Convenience functions
export const sendNotification = (options: NotificationOptions) =>
  notifications.send(options);

export const sendFromTemplate = (templateId: string, userId: string, variables: Record<string, any>) =>
  notifications.sendFromTemplate(templateId, userId, variables);

export const getUserNotifications = (userId: string, options?: any) =>
  notifications.getUserNotifications(userId, options);

export const markNotificationAsRead = (notificationId: string) =>
  notifications.markAsRead(notificationId);

export const getUnreadNotificationCount = (userId: string) =>
  notifications.getUnreadCount(userId);
