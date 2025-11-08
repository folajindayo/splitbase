import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum ScheduleType {
  ONCE = 'once',
  RECURRING = 'recurring',
  CRON = 'cron',
}

export enum ScheduleStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface ScheduleConfig {
  id?: string;
  name: string;
  type: ScheduleType;
  handler: string; // Function name to execute
  payload?: Record<string, any>;
  schedule?: {
    cron?: string; // Cron expression
    interval?: number; // Milliseconds
    date?: string; // ISO date for one-time jobs
  };
  options?: {
    timezone?: string;
    retries?: number;
    timeout?: number;
    priority?: number;
    enabled?: boolean;
  };
}

export interface ScheduledJob {
  id: string;
  name: string;
  type: ScheduleType;
  handler: string;
  payload?: Record<string, any>;
  schedule: {
    cron?: string;
    interval?: number;
    date?: string;
  };
  options: {
    timezone: string;
    retries: number;
    timeout: number;
    priority: number;
    enabled: boolean;
  };
  status: ScheduleStatus;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobExecution {
  id: string;
  jobId: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  status: ScheduleStatus;
  result?: any;
  error?: {
    message: string;
    stack?: string;
  };
  attempts: number;
}

type JobHandler = (payload?: Record<string, any>) => Promise<any>;

class Scheduler {
  private static instance: Scheduler;
  private handlers: Map<string, JobHandler> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private running = false;
  private readonly CHECK_INTERVAL = 60000; // 1 minute

  private constructor() {}

  static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  // Register job handler
  registerHandler(name: string, handler: JobHandler): void {
    this.handlers.set(name, handler);
  }

  // Unregister job handler
  unregisterHandler(name: string): void {
    this.handlers.delete(name);
  }

  // Schedule a job
  async schedule(config: ScheduleConfig): Promise<ScheduledJob> {
    try {
      const nextRunAt = this.calculateNextRun(config);

      const jobData = {
        name: config.name,
        type: config.type,
        handler: config.handler,
        payload: config.payload,
        schedule: config.schedule,
        options: {
          timezone: config.options?.timezone || 'UTC',
          retries: config.options?.retries ?? 3,
          timeout: config.options?.timeout || 300000, // 5 minutes
          priority: config.options?.priority ?? 0,
          enabled: config.options?.enabled ?? true,
        },
        status: ScheduleStatus.PENDING,
        next_run_at: nextRunAt,
        run_count: 0,
        failure_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('scheduled_jobs')
        .insert(jobData)
        .select()
        .single();

      if (error) throw error;

      const job = this.mapToScheduledJob(data);

      // Set up timer if scheduler is running
      if (this.running && job.options.enabled) {
        this.setupJobTimer(job);
      }

      return job;
    } catch (error: any) {
      console.error('Failed to schedule job:', error);
      throw error;
    }
  }

  // Update scheduled job
  async update(jobId: string, updates: Partial<ScheduleConfig>): Promise<boolean> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.handler) updateData.handler = updates.handler;
      if (updates.payload) updateData.payload = updates.payload;
      if (updates.schedule) updateData.schedule = updates.schedule;
      if (updates.options) updateData.options = updates.options;

      // Recalculate next run if schedule changed
      if (updates.schedule || updates.type) {
        const job = await this.getJob(jobId);
        if (job) {
          const config: ScheduleConfig = {
            name: job.name,
            type: updates.type || job.type,
            handler: job.handler,
            schedule: updates.schedule || job.schedule,
          };
          updateData.next_run_at = this.calculateNextRun(config);
        }
      }

      const { error } = await supabase
        .from('scheduled_jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;

      // Restart timer
      this.clearJobTimer(jobId);
      const job = await this.getJob(jobId);
      if (job && job.options.enabled) {
        this.setupJobTimer(job);
      }

      return true;
    } catch (error) {
      console.error('Failed to update job:', error);
      return false;
    }
  }

  // Cancel scheduled job
  async cancel(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_jobs')
        .update({
          status: ScheduleStatus.CANCELLED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (error) throw error;

      this.clearJobTimer(jobId);

      return true;
    } catch (error) {
      console.error('Failed to cancel job:', error);
      return false;
    }
  }

  // Delete scheduled job
  async delete(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      this.clearJobTimer(jobId);

      return true;
    } catch (error) {
      console.error('Failed to delete job:', error);
      return false;
    }
  }

  // Get scheduled job
  async getJob(jobId: string): Promise<ScheduledJob | null> {
    try {
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !data) return null;

      return this.mapToScheduledJob(data);
    } catch (error) {
      console.error('Failed to get job:', error);
      return null;
    }
  }

  // List scheduled jobs
  async list(options: {
    type?: ScheduleType;
    status?: ScheduleStatus;
    enabled?: boolean;
    limit?: number;
  } = {}): Promise<ScheduledJob[]> {
    try {
      let query = supabase.from('scheduled_jobs').select('*');

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.enabled !== undefined) {
        query = query.eq('options->>enabled', options.enabled);
      }

      query = query.order('next_run_at', { ascending: true });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToScheduledJob);
    } catch (error) {
      console.error('Failed to list jobs:', error);
      return [];
    }
  }

  // Execute job immediately
  async executeNow(jobId: string): Promise<JobExecution> {
    const job = await this.getJob(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    return this.executeJob(job);
  }

  // Execute job
  private async executeJob(job: ScheduledJob, attempt = 1): Promise<JobExecution> {
    const executionId = `exec-${Date.now()}`;
    const startedAt = new Date().toISOString();

    try {
      // Update job status
      await supabase
        .from('scheduled_jobs')
        .update({
          status: ScheduleStatus.RUNNING,
          last_run_at: startedAt,
          updated_at: startedAt,
        })
        .eq('id', job.id);

      // Get handler
      const handler = this.handlers.get(job.handler);

      if (!handler) {
        throw new Error(`Handler '${job.handler}' not found`);
      }

      // Execute with timeout
      const result = await this.executeWithTimeout(
        handler(job.payload),
        job.options.timeout
      );

      const completedAt = new Date().toISOString();
      const duration =
        new Date(completedAt).getTime() - new Date(startedAt).getTime();

      // Update job
      await supabase
        .from('scheduled_jobs')
        .update({
          status: ScheduleStatus.COMPLETED,
          run_count: job.runCount + 1,
          next_run_at: this.calculateNextRun(job),
          updated_at: completedAt,
        })
        .eq('id', job.id);

      // Save execution record
      const execution: JobExecution = {
        id: executionId,
        jobId: job.id,
        startedAt,
        completedAt,
        duration,
        status: ScheduleStatus.COMPLETED,
        result,
        attempts: attempt,
      };

      await this.saveExecution(execution);

      // Schedule next run
      const updatedJob = await this.getJob(job.id);
      if (updatedJob && updatedJob.options.enabled) {
        this.setupJobTimer(updatedJob);
      }

      return execution;
    } catch (error: any) {
      const completedAt = new Date().toISOString();
      const duration =
        new Date(completedAt).getTime() - new Date(startedAt).getTime();

      // Check if should retry
      if (attempt < job.options.retries) {
        console.log(`Retrying job ${job.id}, attempt ${attempt + 1}`);
        return this.executeJob(job, attempt + 1);
      }

      // Update job as failed
      await supabase
        .from('scheduled_jobs')
        .update({
          status: ScheduleStatus.FAILED,
          failure_count: job.failureCount + 1,
          next_run_at: this.calculateNextRun(job),
          updated_at: completedAt,
        })
        .eq('id', job.id);

      // Save execution record
      const execution: JobExecution = {
        id: executionId,
        jobId: job.id,
        startedAt,
        completedAt,
        duration,
        status: ScheduleStatus.FAILED,
        error: {
          message: error.message,
          stack: error.stack,
        },
        attempts: attempt,
      };

      await this.saveExecution(execution);

      return execution;
    }
  }

  // Execute with timeout
  private executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Job execution timeout')), timeout)
      ),
    ]);
  }

  // Save execution record
  private async saveExecution(execution: JobExecution): Promise<void> {
    try {
      await supabase.from('job_executions').insert({
        id: execution.id,
        job_id: execution.jobId,
        started_at: execution.startedAt,
        completed_at: execution.completedAt,
        duration: execution.duration,
        status: execution.status,
        result: execution.result,
        error: execution.error,
        attempts: execution.attempts,
      });
    } catch (error) {
      console.error('Failed to save execution:', error);
    }
  }

  // Setup job timer
  private setupJobTimer(job: ScheduledJob): void {
    if (!job.nextRunAt) return;

    const delay = new Date(job.nextRunAt).getTime() - Date.now();

    if (delay <= 0) {
      // Execute immediately
      this.executeJob(job);
      return;
    }

    const timer = setTimeout(() => {
      this.executeJob(job);
    }, delay);

    this.timers.set(job.id, timer);
  }

  // Clear job timer
  private clearJobTimer(jobId: string): void {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }
  }

  // Calculate next run time
  private calculateNextRun(config: ScheduleConfig | ScheduledJob): string | null {
    const now = new Date();

    if (config.type === ScheduleType.ONCE) {
      return config.schedule?.date || null;
    }

    if (config.type === ScheduleType.RECURRING && config.schedule?.interval) {
      return new Date(now.getTime() + config.schedule.interval).toISOString();
    }

    if (config.type === ScheduleType.CRON && config.schedule?.cron) {
      // Parse cron expression and calculate next run
      // This is a simplified version - use a library like node-cron in production
      return this.getNextCronRun(config.schedule.cron, now);
    }

    return null;
  }

  // Get next cron run (simplified)
  private getNextCronRun(cronExpression: string, from: Date): string {
    // This is a simplified implementation
    // In production, use a library like cron-parser
    const parts = cronExpression.split(' ');

    // For now, assume daily at midnight
    const next = new Date(from);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);

    return next.toISOString();
  }

  // Start scheduler
  async start(): Promise<void> {
    if (this.running) return;

    this.running = true;

    // Load all enabled jobs
    const jobs = await this.list({ enabled: true });

    // Setup timers for all jobs
    for (const job of jobs) {
      this.setupJobTimer(job);
    }

    console.log(`Scheduler started with ${jobs.length} jobs`);
  }

  // Stop scheduler
  stop(): void {
    this.running = false;

    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();

    console.log('Scheduler stopped');
  }

  // Get job executions
  async getExecutions(jobId: string, limit = 10): Promise<JobExecution[]> {
    try {
      const { data, error } = await supabase
        .from('job_executions')
        .select('*')
        .eq('job_id', jobId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get executions:', error);
      return [];
    }
  }

  // Get scheduler statistics
  async getStats(): Promise<{
    totalJobs: number;
    enabledJobs: number;
    runningJobs: number;
    failedJobs: number;
    totalExecutions: number;
    successRate: number;
  }> {
    try {
      const { data: jobsData } = await supabase
        .from('scheduled_jobs')
        .select('status, options');

      const { data: execData } = await supabase
        .from('job_executions')
        .select('status');

      const stats = {
        totalJobs: jobsData?.length || 0,
        enabledJobs:
          jobsData?.filter((j) => j.options?.enabled).length || 0,
        runningJobs:
          jobsData?.filter((j) => j.status === ScheduleStatus.RUNNING).length || 0,
        failedJobs:
          jobsData?.filter((j) => j.status === ScheduleStatus.FAILED).length || 0,
        totalExecutions: execData?.length || 0,
        successRate: 0,
      };

      if (stats.totalExecutions > 0) {
        const successful =
          execData?.filter((e) => e.status === ScheduleStatus.COMPLETED).length || 0;
        stats.successRate = (successful / stats.totalExecutions) * 100;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalJobs: 0,
        enabledJobs: 0,
        runningJobs: 0,
        failedJobs: 0,
        totalExecutions: 0,
        successRate: 0,
      };
    }
  }

  // Map database record to ScheduledJob
  private mapToScheduledJob(data: any): ScheduledJob {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      handler: data.handler,
      payload: data.payload,
      schedule: data.schedule,
      options: data.options,
      status: data.status,
      lastRunAt: data.last_run_at,
      nextRunAt: data.next_run_at,
      runCount: data.run_count,
      failureCount: data.failure_count,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Export singleton instance
export const scheduler = Scheduler.getInstance();

// Convenience functions
export const scheduleJob = (config: ScheduleConfig) => scheduler.schedule(config);
export const cancelJob = (jobId: string) => scheduler.cancel(jobId);
export const executeJob = (jobId: string) => scheduler.executeNow(jobId);
export const registerHandler = (name: string, handler: JobHandler) =>
  scheduler.registerHandler(name, handler);

