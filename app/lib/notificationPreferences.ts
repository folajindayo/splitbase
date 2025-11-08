import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook',
}

export enum NotificationCategory {
  ACCOUNT = 'account',
  ESCROW = 'escrow',
  PAYMENT = 'payment',
  SECURITY = 'security',
  MARKETING = 'marketing',
  SYSTEM = 'system',
  DISPUTE = 'dispute',
  DOCUMENT = 'document',
}

export enum NotificationEvent {
  // Account events
  ACCOUNT_CREATED = 'account.created',
  ACCOUNT_VERIFIED = 'account.verified',
  PASSWORD_CHANGED = 'password.changed',
  EMAIL_CHANGED = 'email.changed',

  // Escrow events
  ESCROW_CREATED = 'escrow.created',
  ESCROW_FUNDED = 'escrow.funded',
  ESCROW_RELEASED = 'escrow.released',
  ESCROW_DISPUTED = 'escrow.disputed',
  ESCROW_COMPLETED = 'escrow.completed',

  // Payment events
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_SENT = 'payment.sent',
  PAYMENT_FAILED = 'payment.failed',
  REFUND_PROCESSED = 'refund.processed',

  // Security events
  LOGIN_NEW_DEVICE = 'login.new_device',
  SUSPICIOUS_ACTIVITY = 'suspicious.activity',
  TWO_FACTOR_ENABLED = 'two_factor.enabled',
  TWO_FACTOR_DISABLED = 'two_factor.disabled',

  // Document events
  DOCUMENT_VERIFIED = 'document.verified',
  DOCUMENT_REJECTED = 'document.rejected',

  // Dispute events
  DISPUTE_CREATED = 'dispute.created',
  DISPUTE_RESOLVED = 'dispute.resolved',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  channels: ChannelPreferences;
  events: EventPreferences;
  doNotDisturb?: DoNotDisturbSettings;
  language?: string;
  timezone?: string;
  updatedAt: string;
}

export interface ChannelPreferences {
  email: {
    enabled: boolean;
    address?: string;
    verified: boolean;
  };
  sms: {
    enabled: boolean;
    phoneNumber?: string;
    verified: boolean;
  };
  push: {
    enabled: boolean;
    deviceTokens?: string[];
  };
  inApp: {
    enabled: boolean;
  };
  webhook: {
    enabled: boolean;
    url?: string;
    secret?: string;
  };
}

export interface EventPreferences {
  [NotificationEvent.ACCOUNT_CREATED]?: EventChannelSettings;
  [NotificationEvent.ACCOUNT_VERIFIED]?: EventChannelSettings;
  [NotificationEvent.PASSWORD_CHANGED]?: EventChannelSettings;
  [NotificationEvent.EMAIL_CHANGED]?: EventChannelSettings;
  [NotificationEvent.ESCROW_CREATED]?: EventChannelSettings;
  [NotificationEvent.ESCROW_FUNDED]?: EventChannelSettings;
  [NotificationEvent.ESCROW_RELEASED]?: EventChannelSettings;
  [NotificationEvent.ESCROW_DISPUTED]?: EventChannelSettings;
  [NotificationEvent.ESCROW_COMPLETED]?: EventChannelSettings;
  [NotificationEvent.PAYMENT_RECEIVED]?: EventChannelSettings;
  [NotificationEvent.PAYMENT_SENT]?: EventChannelSettings;
  [NotificationEvent.PAYMENT_FAILED]?: EventChannelSettings;
  [NotificationEvent.REFUND_PROCESSED]?: EventChannelSettings;
  [NotificationEvent.LOGIN_NEW_DEVICE]?: EventChannelSettings;
  [NotificationEvent.SUSPICIOUS_ACTIVITY]?: EventChannelSettings;
  [NotificationEvent.TWO_FACTOR_ENABLED]?: EventChannelSettings;
  [NotificationEvent.TWO_FACTOR_DISABLED]?: EventChannelSettings;
  [NotificationEvent.DOCUMENT_VERIFIED]?: EventChannelSettings;
  [NotificationEvent.DOCUMENT_REJECTED]?: EventChannelSettings;
  [NotificationEvent.DISPUTE_CREATED]?: EventChannelSettings;
  [NotificationEvent.DISPUTE_RESOLVED]?: EventChannelSettings;
}

export interface EventChannelSettings {
  enabled: boolean;
  channels: NotificationChannel[];
  priority?: NotificationPriority;
  digest?: boolean;
  digestFrequency?: 'hourly' | 'daily' | 'weekly';
}

export interface DoNotDisturbSettings {
  enabled: boolean;
  schedule?: {
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    days?: number[]; // 0-6 (Sunday-Saturday)
  };
  exceptions?: NotificationEvent[];
}

export interface NotificationTemplate {
  id: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  language: string;
  subject?: string;
  body: string;
  variables: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DigestSettings {
  enabled: boolean;
  frequency: 'hourly' | 'daily' | 'weekly';
  time?: string; // HH:mm (for daily/weekly)
  dayOfWeek?: number; // 0-6 (for weekly)
  categories: NotificationCategory[];
}

class NotificationPreferencesSystem {
  private static instance: NotificationPreferencesSystem;

  private readonly defaultPreferences: Partial<NotificationPreferences> = {
    channels: {
      email: { enabled: true, verified: false },
      sms: { enabled: false, verified: false },
      push: { enabled: true },
      inApp: { enabled: true },
      webhook: { enabled: false },
    },
    events: {
      [NotificationEvent.ACCOUNT_CREATED]: {
        enabled: true,
        channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.NORMAL,
      },
      [NotificationEvent.PASSWORD_CHANGED]: {
        enabled: true,
        channels: [NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority: NotificationPriority.HIGH,
      },
      [NotificationEvent.ESCROW_FUNDED]: {
        enabled: true,
        channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH,
      },
      [NotificationEvent.PAYMENT_RECEIVED]: {
        enabled: true,
        channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH,
      },
      [NotificationEvent.SUSPICIOUS_ACTIVITY]: {
        enabled: true,
        channels: [NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority: NotificationPriority.URGENT,
      },
    },
  };

  private constructor() {}

  static getInstance(): NotificationPreferencesSystem {
    if (!NotificationPreferencesSystem.instance) {
      NotificationPreferencesSystem.instance = new NotificationPreferencesSystem();
    }
    return NotificationPreferencesSystem.instance;
  }

  // Get user preferences
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Create default preferences
        return this.createDefaultPreferences(userId);
      }

      return {
        id: data.id,
        userId: data.user_id,
        channels: data.channels,
        events: data.events,
        doNotDisturb: data.do_not_disturb,
        language: data.language,
        timezone: data.timezone,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return this.createDefaultPreferences(userId);
    }
  }

  // Update preferences
  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const existing = await this.getPreferences(userId);

      const updateData = {
        channels: updates.channels || existing.channels,
        events: updates.events || existing.events,
        do_not_disturb: updates.doNotDisturb || existing.doNotDisturb,
        language: updates.language || existing.language,
        timezone: updates.timezone || existing.timezone,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('notification_preferences')
        .update(updateData)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return false;
    }
  }

  // Update channel preference
  async updateChannel(
    userId: string,
    channel: NotificationChannel,
    settings: Partial<ChannelPreferences[NotificationChannel]>
  ): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(userId);

      preferences.channels[channel] = {
        ...preferences.channels[channel],
        ...settings,
      } as any;

      return this.updatePreferences(userId, { channels: preferences.channels });
    } catch (error) {
      console.error('Failed to update channel:', error);
      return false;
    }
  }

  // Update event preference
  async updateEvent(
    userId: string,
    event: NotificationEvent,
    settings: EventChannelSettings
  ): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(userId);

      preferences.events[event] = settings;

      return this.updatePreferences(userId, { events: preferences.events });
    } catch (error) {
      console.error('Failed to update event:', error);
      return false;
    }
  }

  // Bulk update events
  async bulkUpdateEvents(
    userId: string,
    events: Partial<EventPreferences>
  ): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(userId);

      preferences.events = {
        ...preferences.events,
        ...events,
      };

      return this.updatePreferences(userId, { events: preferences.events });
    } catch (error) {
      console.error('Failed to bulk update events:', error);
      return false;
    }
  }

  // Set do not disturb
  async setDoNotDisturb(
    userId: string,
    settings: DoNotDisturbSettings
  ): Promise<boolean> {
    return this.updatePreferences(userId, { doNotDisturb: settings });
  }

  // Check if notification should be sent
  async shouldSend(
    userId: string,
    event: NotificationEvent,
    channel: NotificationChannel
  ): Promise<boolean> {
    try {
      const preferences = await this.getPreferences(userId);

      // Check if channel is enabled
      if (!preferences.channels[channel]?.enabled) {
        return false;
      }

      // Check if event is enabled
      const eventSettings = preferences.events[event];
      if (!eventSettings || !eventSettings.enabled) {
        return false;
      }

      // Check if channel is in event's allowed channels
      if (!eventSettings.channels.includes(channel)) {
        return false;
      }

      // Check do not disturb
      if (preferences.doNotDisturb?.enabled) {
        if (this.isInDoNotDisturbPeriod(preferences.doNotDisturb)) {
          // Check if event is an exception
          if (!preferences.doNotDisturb.exceptions?.includes(event)) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to check if should send:', error);
      return false;
    }
  }

  // Get notification template
  async getTemplate(
    event: NotificationEvent,
    channel: NotificationChannel,
    language: string = 'en'
  ): Promise<NotificationTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('event', event)
        .eq('channel', channel)
        .eq('language', language)
        .eq('active', true)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        event: data.event,
        channel: data.channel,
        language: data.language,
        subject: data.subject,
        body: data.body,
        variables: data.variables,
        active: data.active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Failed to get template:', error);
      return null;
    }
  }

  // Create or update template
  async saveTemplate(
    template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .upsert({
          event: template.event,
          channel: template.channel,
          language: template.language,
          subject: template.subject,
          body: template.body,
          variables: template.variables,
          active: template.active,
          updated_at: new Date().toISOString(),
        });

      return !error;
    } catch (error) {
      console.error('Failed to save template:', error);
      return false;
    }
  }

  // Render template
  renderTemplate(template: NotificationTemplate, variables: Record<string, any>): {
    subject?: string;
    body: string;
  } {
    let subject = template.subject;
    let body = template.body;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      if (subject) {
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      }
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return { subject, body };
  }

  // Get digest settings
  async getDigestSettings(userId: string): Promise<DigestSettings | null> {
    try {
      const { data, error } = await supabase
        .from('digest_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        enabled: data.enabled,
        frequency: data.frequency,
        time: data.time,
        dayOfWeek: data.day_of_week,
        categories: data.categories,
      };
    } catch (error) {
      console.error('Failed to get digest settings:', error);
      return null;
    }
  }

  // Update digest settings
  async updateDigestSettings(
    userId: string,
    settings: DigestSettings
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('digest_settings')
        .upsert({
          user_id: userId,
          enabled: settings.enabled,
          frequency: settings.frequency,
          time: settings.time,
          day_of_week: settings.dayOfWeek,
          categories: settings.categories,
          updated_at: new Date().toISOString(),
        });

      return !error;
    } catch (error) {
      console.error('Failed to update digest settings:', error);
      return false;
    }
  }

  // Verify channel (email/SMS)
  async verifyChannel(
    userId: string,
    channel: 'email' | 'sms',
    code: string
  ): Promise<boolean> {
    try {
      // In production, verify the code
      // For now, just mark as verified

      const preferences = await this.getPreferences(userId);

      if (channel === 'email') {
        preferences.channels.email.verified = true;
      } else {
        preferences.channels.sms.verified = true;
      }

      return this.updatePreferences(userId, { channels: preferences.channels });
    } catch (error) {
      console.error('Failed to verify channel:', error);
      return false;
    }
  }

  // Get notification statistics
  async getStats(userId: string): Promise<{
    totalEnabled: number;
    byChannel: Record<NotificationChannel, number>;
    byCategory: Record<NotificationCategory, number>;
  }> {
    try {
      const preferences = await this.getPreferences(userId);

      const stats = {
        totalEnabled: 0,
        byChannel: {} as Record<NotificationChannel, number>,
        byCategory: {} as Record<NotificationCategory, number>,
      };

      Object.entries(preferences.events).forEach(([event, settings]) => {
        if (settings?.enabled) {
          stats.totalEnabled++;

          settings.channels.forEach((channel) => {
            stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
          });
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalEnabled: 0,
        byChannel: {} as any,
        byCategory: {} as any,
      };
    }
  }

  // Create default preferences
  private async createDefaultPreferences(
    userId: string
  ): Promise<NotificationPreferences> {
    const preferences = {
      user_id: userId,
      channels: this.defaultPreferences.channels,
      events: this.defaultPreferences.events,
      language: 'en',
      timezone: 'UTC',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('notification_preferences')
      .insert(preferences)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      channels: data.channels,
      events: data.events,
      doNotDisturb: data.do_not_disturb,
      language: data.language,
      timezone: data.timezone,
      updatedAt: data.updated_at,
    };
  }

  // Check if in do not disturb period
  private isInDoNotDisturbPeriod(settings: DoNotDisturbSettings): boolean {
    if (!settings.schedule) return false;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Check day of week
    if (settings.schedule.days && !settings.schedule.days.includes(currentDay)) {
      return false;
    }

    // Check time range
    return (
      currentTime >= settings.schedule.startTime &&
      currentTime <= settings.schedule.endTime
    );
  }
}

// Export singleton instance
export const notificationPreferences = NotificationPreferencesSystem.getInstance();

// Convenience functions
export const getPreferences = (userId: string) =>
  notificationPreferences.getPreferences(userId);

export const updatePreferences = (userId: string, updates: any) =>
  notificationPreferences.updatePreferences(userId, updates);

export const shouldSendNotification = (userId: string, event: NotificationEvent, channel: NotificationChannel) =>
  notificationPreferences.shouldSend(userId, event, channel);

export const getNotificationTemplate = (event: NotificationEvent, channel: NotificationChannel, language?: string) =>
  notificationPreferences.getTemplate(event, channel, language);

export const renderNotificationTemplate = (template: NotificationTemplate, variables: Record<string, any>) =>
  notificationPreferences.renderTemplate(template, variables);

