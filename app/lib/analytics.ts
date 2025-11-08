import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface AnalyticsEvent {
  userId?: string;
  sessionId?: string;
  event: string;
  category: string;
  properties?: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  page?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface MetricData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface DashboardMetrics {
  totalUsers: MetricData;
  activeUsers: MetricData;
  totalTransactions: MetricData;
  totalVolume: MetricData;
  averageTransactionValue: MetricData;
  successRate: MetricData;
}

export interface UserMetrics {
  totalTransactions: number;
  totalVolume: number;
  averageTransactionValue: number;
  successRate: number;
  activeTime: number; // in minutes
  lastActive: string;
  registrationDate: string;
  lifetimeValue: number;
}

export interface ConversionFunnel {
  step: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

export interface RetentionCohort {
  cohort: string;
  period0: number;
  period1?: number;
  period2?: number;
  period3?: number;
  period4?: number;
  period5?: number;
  period6?: number;
}

class AnalyticsSystem {
  private static instance: AnalyticsSystem;
  private eventQueue: Omit<AnalyticsEvent, 'timestamp'>[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 10000; // 10 seconds

  private constructor() {
    this.startAutoFlush();
  }

  static getInstance(): AnalyticsSystem {
    if (!AnalyticsSystem.instance) {
      AnalyticsSystem.instance = new AnalyticsSystem();
    }
    return AnalyticsSystem.instance;
  }

  // Track an event
  async track(event: Omit<AnalyticsEvent, 'timestamp'>): Promise<void> {
    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  // Track page view
  async trackPageView(
    userId: string | undefined,
    page: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track({
      userId,
      event: 'page_view',
      category: 'navigation',
      page,
      properties,
    });
  }

  // Track user action
  async trackAction(
    userId: string,
    action: string,
    category: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track({
      userId,
      event: action,
      category,
      properties,
    });
  }

  // Flush event queue
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.map(event => ({
      ...event,
      timestamp: new Date().toISOString(),
    }));

    this.eventQueue = [];

    try {
      await supabase.from('analytics_events').insert(events);
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Put events back in queue on failure
      this.eventQueue.unshift(...events);
    }
  }

  // Start auto-flush
  private startAutoFlush(): void {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  // Stop auto-flush
  stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  // Get dashboard metrics
  async getDashboardMetrics(
    startDate: string,
    endDate: string,
    compareStartDate?: string,
    compareEndDate?: string
  ): Promise<DashboardMetrics> {
    try {
      const currentMetrics = await this.calculateMetrics(startDate, endDate);
      
      let previousMetrics = {
        totalUsers: 0,
        activeUsers: 0,
        totalTransactions: 0,
        totalVolume: 0,
        averageTransactionValue: 0,
        successRate: 0,
      };

      if (compareStartDate && compareEndDate) {
        previousMetrics = await this.calculateMetrics(compareStartDate, compareEndDate);
      }

      return {
        totalUsers: this.calculateMetricData(currentMetrics.totalUsers, previousMetrics.totalUsers),
        activeUsers: this.calculateMetricData(currentMetrics.activeUsers, previousMetrics.activeUsers),
        totalTransactions: this.calculateMetricData(
          currentMetrics.totalTransactions,
          previousMetrics.totalTransactions
        ),
        totalVolume: this.calculateMetricData(currentMetrics.totalVolume, previousMetrics.totalVolume),
        averageTransactionValue: this.calculateMetricData(
          currentMetrics.averageTransactionValue,
          previousMetrics.averageTransactionValue
        ),
        successRate: this.calculateMetricData(currentMetrics.successRate, previousMetrics.successRate),
      };
    } catch (error) {
      console.error('Failed to get dashboard metrics:', error);
      throw error;
    }
  }

  // Calculate metrics for a period
  private async calculateMetrics(startDate: string, endDate: string) {
    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Active users
    const { count: activeUsers } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact', head: true })
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .not('user_id', 'is', null);

    // Transaction metrics
    const { data: transactions } = await supabase
      .from('escrow_transactions')
      .select('amount, status')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const totalTransactions = transactions?.length || 0;
    const totalVolume = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const averageTransactionValue = totalTransactions > 0 ? totalVolume / totalTransactions : 0;
    const successfulTransactions =
      transactions?.filter(t => t.status === 'completed').length || 0;
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalTransactions,
      totalVolume,
      averageTransactionValue,
      successRate,
    };
  }

  // Calculate metric data with comparison
  private calculateMetricData(current: number, previous: number): MetricData {
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

    return {
      current,
      previous,
      change,
      changePercent: Math.round(changePercent * 10) / 10,
      trend,
    };
  }

  // Get time series data
  async getTimeSeries(
    metric: 'users' | 'transactions' | 'volume',
    startDate: string,
    endDate: string,
    interval: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<TimeSeriesData[]> {
    try {
      let table: string;
      let valueColumn: string;

      switch (metric) {
        case 'users':
          table = 'users';
          valueColumn = 'created_at';
          break;
        case 'transactions':
          table = 'escrow_transactions';
          valueColumn = 'created_at';
          break;
        case 'volume':
          table = 'escrow_transactions';
          valueColumn = 'amount';
          break;
      }

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      // Group by interval
      const grouped: Record<string, number> = {};

      data?.forEach(row => {
        const date = new Date(row.created_at);
        let key: string;

        switch (interval) {
          case 'hour':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
              date.getDate()
            ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
            break;
          case 'day':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
              date.getDate()
            ).padStart(2, '0')}`;
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(
              2,
              '0'
            )}-${String(weekStart.getDate()).padStart(2, '0')}`;
            break;
          case 'month':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
        }

        if (metric === 'volume') {
          grouped[key] = (grouped[key] || 0) + (row.amount || 0);
        } else {
          grouped[key] = (grouped[key] || 0) + 1;
        }
      });

      return Object.entries(grouped)
        .map(([date, value]) => ({ date, value }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Failed to get time series data:', error);
      return [];
    }
  }

  // Get user metrics
  async getUserMetrics(userId: string): Promise<UserMetrics> {
    try {
      // User transactions
      const { data: transactions } = await supabase
        .from('escrow_transactions')
        .select('amount, status, created_at')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      const totalTransactions = transactions?.length || 0;
      const totalVolume = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const averageTransactionValue = totalTransactions > 0 ? totalVolume / totalTransactions : 0;
      const successfulTransactions =
        transactions?.filter(t => t.status === 'completed').length || 0;
      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

      // User activity
      const { data: events } = await supabase
        .from('analytics_events')
        .select('timestamp')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1);

      const lastActive = events?.[0]?.timestamp || '';

      // User info
      const { data: user } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      const registrationDate = user?.created_at || '';

      // Calculate active time (simplified - count unique days active)
      const { data: activeData } = await supabase
        .from('analytics_events')
        .select('timestamp')
        .eq('user_id', userId);

      const uniqueDays = new Set(
        activeData?.map(e => new Date(e.timestamp).toDateString())
      ).size;
      const activeTime = uniqueDays * 30; // Rough estimate: 30 min per day

      return {
        totalTransactions,
        totalVolume,
        averageTransactionValue,
        successRate,
        activeTime,
        lastActive,
        registrationDate,
        lifetimeValue: totalVolume,
      };
    } catch (error) {
      console.error('Failed to get user metrics:', error);
      throw error;
    }
  }

  // Get conversion funnel
  async getConversionFunnel(startDate: string, endDate: string): Promise<ConversionFunnel[]> {
    try {
      const steps = [
        { step: 'Registration', event: 'user_registered' },
        { step: 'Profile Completed', event: 'profile_completed' },
        { step: 'First Escrow Created', event: 'escrow_created' },
        { step: 'First Payment', event: 'payment_completed' },
        { step: 'Transaction Completed', event: 'transaction_completed' },
      ];

      const funnel: ConversionFunnel[] = [];
      let previousUsers = 0;

      for (const [index, { step, event }] of steps.entries()) {
        const { count } = await supabase
          .from('analytics_events')
          .select('user_id', { count: 'exact', head: true })
          .eq('event', event)
          .gte('timestamp', startDate)
          .lte('timestamp', endDate);

        const users = count || 0;
        const conversionRate = index === 0 ? 100 : previousUsers > 0 ? (users / previousUsers) * 100 : 0;
        const dropoffRate = 100 - conversionRate;

        funnel.push({
          step,
          users,
          conversionRate: Math.round(conversionRate * 10) / 10,
          dropoffRate: Math.round(dropoffRate * 10) / 10,
        });

        previousUsers = users;
      }

      return funnel;
    } catch (error) {
      console.error('Failed to get conversion funnel:', error);
      return [];
    }
  }

  // Get retention cohorts
  async getRetentionCohorts(): Promise<RetentionCohort[]> {
    try {
      // Simplified cohort analysis - group by registration month
      const { data: users } = await supabase
        .from('users')
        .select('id, created_at')
        .order('created_at', { ascending: true });

      if (!users) return [];

      const cohorts: Record<string, RetentionCohort> = {};

      for (const user of users) {
        const cohortMonth = new Date(user.created_at).toISOString().slice(0, 7);
        
        if (!cohorts[cohortMonth]) {
          cohorts[cohortMonth] = {
            cohort: cohortMonth,
            period0: 0,
            period1: 0,
            period2: 0,
            period3: 0,
            period4: 0,
            period5: 0,
            period6: 0,
          };
        }

        // Count user as active in period 0 (registration month)
        cohorts[cohortMonth].period0++;

        // Check activity in subsequent months
        const { data: activity } = await supabase
          .from('analytics_events')
          .select('timestamp')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: true });

        if (activity) {
          for (let period = 1; period <= 6; period++) {
            const periodStart = new Date(cohortMonth);
            periodStart.setMonth(periodStart.getMonth() + period);
            const periodEnd = new Date(periodStart);
            periodEnd.setMonth(periodEnd.getMonth() + 1);

            const wasActive = activity.some(a => {
              const activityDate = new Date(a.timestamp);
              return activityDate >= periodStart && activityDate < periodEnd;
            });

            if (wasActive) {
              const periodKey = `period${period}` as keyof RetentionCohort;
              if (typeof cohorts[cohortMonth][periodKey] === 'number') {
                (cohorts[cohortMonth][periodKey] as number)++;
              }
            }
          }
        }
      }

      return Object.values(cohorts);
    } catch (error) {
      console.error('Failed to get retention cohorts:', error);
      return [];
    }
  }

  // Get top pages
  async getTopPages(
    startDate: string,
    endDate: string,
    limit: number = 10
  ): Promise<Array<{ page: string; views: number; uniqueUsers: number }>> {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('page, user_id')
        .eq('event', 'page_view')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .not('page', 'is', null);

      if (error) throw error;

      const pageStats: Record<string, { views: number; users: Set<string> }> = {};

      data?.forEach(event => {
        if (!pageStats[event.page]) {
          pageStats[event.page] = { views: 0, users: new Set() };
        }
        pageStats[event.page].views++;
        if (event.user_id) {
          pageStats[event.page].users.add(event.user_id);
        }
      });

      return Object.entries(pageStats)
        .map(([page, stats]) => ({
          page,
          views: stats.views,
          uniqueUsers: stats.users.size,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get top pages:', error);
      return [];
    }
  }
}

// Export singleton instance
export const analytics = AnalyticsSystem.getInstance();

// Convenience functions
export const trackEvent = (event: Omit<AnalyticsEvent, 'timestamp'>) =>
  analytics.track(event);

export const trackPageView = (userId: string | undefined, page: string, properties?: Record<string, any>) =>
  analytics.trackPageView(userId, page, properties);

export const trackUserAction = (userId: string, action: string, category: string, properties?: Record<string, any>) =>
  analytics.trackAction(userId, action, category, properties);

export const getDashboardMetrics = (
  startDate: string,
  endDate: string,
  compareStartDate?: string,
  compareEndDate?: string
) => analytics.getDashboardMetrics(startDate, endDate, compareStartDate, compareEndDate);

export const getTimeSeries = (
  metric: 'users' | 'transactions' | 'volume',
  startDate: string,
  endDate: string,
  interval?: 'hour' | 'day' | 'week' | 'month'
) => analytics.getTimeSeries(metric, startDate, endDate, interval);

export const getUserMetrics = (userId: string) =>
  analytics.getUserMetrics(userId);

