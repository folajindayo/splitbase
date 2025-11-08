import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled',
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}

export interface Job<T = any> {
  id: string;
  queue: string;
  type: string;
  data: T;
  status: JobStatus;
  priority: JobPriority;
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: any;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  nextRetryAt?: string;
  timeout?: number;
}

export interface QueueOptions {
  maxAttempts?: number;
  timeout?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  priority?: JobPriority;
}

export interface JobHandler<T = any> {
  (job: Job<T>): Promise<any>;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  averageProcessingTime: number;
}

class QueueSystem {
  private static instance: QueueSystem;
  private handlers: Map<string, JobHandler>;
  private processingJobs: Set<string>;
  private workers: Map<string, NodeJS.Timeout>;
  private defaultOptions: Required<Omit<QueueOptions, 'priority'>>;

  private constructor() {
    this.handlers = new Map();
    this.processingJobs = new Set();
    this.workers = new Map();
    this.defaultOptions = {
      maxAttempts: 3,
      timeout: 30000, // 30 seconds
      retryDelay: 5000, // 5 seconds
      exponentialBackoff: true,
    };
  }

  static getInstance(): QueueSystem {
    if (!QueueSystem.instance) {
      QueueSystem.instance = new QueueSystem();
    }
    return QueueSystem.instance;
  }

  // Register a job handler
  registerHandler<T = any>(jobType: string, handler: JobHandler<T>): void {
    this.handlers.set(jobType, handler);
  }

  // Add a job to the queue
  async add<T = any>(
    queue: string,
    jobType: string,
    data: T,
    options: QueueOptions = {}
  ): Promise<string> {
    try {
      const job = {
        queue,
        type: jobType,
        data,
        status: JobStatus.PENDING,
        priority: options.priority || JobPriority.NORMAL,
        attempts: 0,
        max_attempts: options.maxAttempts || this.defaultOptions.maxAttempts,
        timeout: options.timeout || this.defaultOptions.timeout,
        retry_delay: options.retryDelay || this.defaultOptions.retryDelay,
        exponential_backoff: options.exponentialBackoff ?? this.defaultOptions.exponentialBackoff,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdJob, error } = await supabase
        .from('job_queue')
        .insert(job)
        .select()
        .single();

      if (error) throw error;

      return createdJob.id;
    } catch (error: any) {
      console.error('Failed to add job to queue:', error);
      throw error;
    }
  }

  // Process jobs from a queue
  async process(queueName: string, concurrency: number = 1): Promise<void> {
    // Start workers
    for (let i = 0; i < concurrency; i++) {
      const workerId = `${queueName}-${i}`;
      
      if (this.workers.has(workerId)) {
        continue; // Worker already running
      }

      const worker = setInterval(() => {
        this.processNext(queueName);
      }, 1000); // Check for jobs every second

      this.workers.set(workerId, worker);
    }
  }

  // Stop processing a queue
  stop(queueName?: string): void {
    if (queueName) {
      // Stop specific queue workers
      for (const [workerId, worker] of this.workers.entries()) {
        if (workerId.startsWith(queueName)) {
          clearInterval(worker);
          this.workers.delete(workerId);
        }
      }
    } else {
      // Stop all workers
      for (const worker of this.workers.values()) {
        clearInterval(worker);
      }
      this.workers.clear();
    }
  }

  // Process next job in queue
  private async processNext(queueName: string): Promise<void> {
    try {
      // Get next job (highest priority, oldest first)
      const { data: jobs, error } = await supabase
        .from('job_queue')
        .select('*')
        .eq('queue', queueName)
        .in('status', [JobStatus.PENDING, JobStatus.RETRYING])
        .lte('next_retry_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) throw error;
      if (!jobs || jobs.length === 0) return;

      const job = jobs[0];

      // Check if already being processed
      if (this.processingJobs.has(job.id)) {
        return;
      }

      // Mark as processing
      this.processingJobs.add(job.id);

      await this.executeJob(job);
    } catch (error) {
      console.error('Error processing job:', error);
    }
  }

  // Execute a job
  private async executeJob(job: Job): Promise<void> {
    try {
      // Update job status
      await supabase
        .from('job_queue')
        .update({
          status: JobStatus.PROCESSING,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      // Get handler
      const handler = this.handlers.get(job.type);

      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      // Execute with timeout
      const result = await this.executeWithTimeout(handler(job), job.timeout || this.defaultOptions.timeout);

      // Mark as completed
      await supabase
        .from('job_queue')
        .update({
          status: JobStatus.COMPLETED,
          result,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      this.processingJobs.delete(job.id);
    } catch (error: any) {
      await this.handleJobFailure(job, error);
    }
  }

  // Execute with timeout
  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Job timeout')), timeout)
      ),
    ]);
  }

  // Handle job failure
  private async handleJobFailure(job: Job, error: Error): Promise<void> {
    try {
      const attempts = job.attempts + 1;
      const maxAttempts = job.maxAttempts || this.defaultOptions.maxAttempts;

      if (attempts < maxAttempts) {
        // Calculate next retry time
        const retryDelay = job.exponentialBackoff
          ? (job.retryDelay || this.defaultOptions.retryDelay) * Math.pow(2, attempts)
          : (job.retryDelay || this.defaultOptions.retryDelay);

        const nextRetryAt = new Date(Date.now() + retryDelay).toISOString();

        // Update job for retry
        await supabase
          .from('job_queue')
          .update({
            status: JobStatus.RETRYING,
            attempts,
            error: error.message,
            next_retry_at: nextRetryAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      } else {
        // Mark as failed
        await supabase
          .from('job_queue')
          .update({
            status: JobStatus.FAILED,
            attempts,
            error: error.message,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      }

      this.processingJobs.delete(job.id);
    } catch (updateError) {
      console.error('Failed to update job after failure:', updateError);
      this.processingJobs.delete(job.id);
    }
  }

  // Get job by ID
  async getJob(jobId: string): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('job_queue')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get job:', error);
      return null;
    }
  }

  // Cancel a job
  async cancel(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('job_queue')
        .update({
          status: JobStatus.CANCELLED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .in('status', [JobStatus.PENDING, JobStatus.RETRYING]);

      return !error;
    } catch (error) {
      console.error('Failed to cancel job:', error);
      return false;
    }
  }

  // Retry a failed job
  async retry(jobId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('job_queue')
        .update({
          status: JobStatus.PENDING,
          attempts: 0,
          error: null,
          next_retry_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('status', JobStatus.FAILED);

      return !error;
    } catch (error) {
      console.error('Failed to retry job:', error);
      return false;
    }
  }

  // Get queue statistics
  async getStats(queueName: string): Promise<QueueStats> {
    try {
      const { data, error } = await supabase
        .from('job_queue')
        .select('status, started_at, completed_at')
        .eq('queue', queueName);

      if (error) throw error;

      const stats: QueueStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalProcessed: 0,
        averageProcessingTime: 0,
      };

      let totalProcessingTime = 0;
      let processedWithTime = 0;

      data?.forEach(job => {
        switch (job.status) {
          case JobStatus.PENDING:
          case JobStatus.RETRYING:
            stats.pending++;
            break;
          case JobStatus.PROCESSING:
            stats.processing++;
            break;
          case JobStatus.COMPLETED:
            stats.completed++;
            stats.totalProcessed++;
            break;
          case JobStatus.FAILED:
            stats.failed++;
            stats.totalProcessed++;
            break;
        }

        // Calculate processing time
        if (job.started_at && job.completed_at) {
          const processingTime =
            new Date(job.completed_at).getTime() - new Date(job.started_at).getTime();
          totalProcessingTime += processingTime;
          processedWithTime++;
        }
      });

      stats.averageProcessingTime =
        processedWithTime > 0 ? totalProcessingTime / processedWithTime : 0;

      return stats;
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        totalProcessed: 0,
        averageProcessingTime: 0,
      };
    }
  }

  // Clean up old completed jobs
  async cleanup(queueName: string, olderThanDays: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from('job_queue')
        .delete()
        .eq('queue', queueName)
        .in('status', [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED])
        .lt('completed_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Failed to cleanup jobs:', error);
      return 0;
    }
  }

  // Get jobs by status
  async getJobsByStatus(
    queueName: string,
    status: JobStatus,
    limit: number = 100
  ): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('job_queue')
        .select('*')
        .eq('queue', queueName)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get jobs by status:', error);
      return [];
    }
  }

  // Bulk add jobs
  async addBulk<T = any>(
    queue: string,
    jobType: string,
    dataArray: T[],
    options: QueueOptions = {}
  ): Promise<string[]> {
    try {
      const jobs = dataArray.map(data => ({
        queue,
        type: jobType,
        data,
        status: JobStatus.PENDING,
        priority: options.priority || JobPriority.NORMAL,
        attempts: 0,
        max_attempts: options.maxAttempts || this.defaultOptions.maxAttempts,
        timeout: options.timeout || this.defaultOptions.timeout,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data: createdJobs, error } = await supabase
        .from('job_queue')
        .insert(jobs)
        .select('id');

      if (error) throw error;
      return createdJobs?.map(job => job.id) || [];
    } catch (error: any) {
      console.error('Failed to add bulk jobs:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const queue = QueueSystem.getInstance();

// Pre-defined queues
export const emailQueue = {
  add: <T>(jobType: string, data: T, options?: QueueOptions) =>
    queue.add('email', jobType, data, options),
  process: (concurrency?: number) => queue.process('email', concurrency),
  stop: () => queue.stop('email'),
  getStats: () => queue.getStats('email'),
};

export const notificationQueue = {
  add: <T>(jobType: string, data: T, options?: QueueOptions) =>
    queue.add('notification', jobType, data, options),
  process: (concurrency?: number) => queue.process('notification', concurrency),
  stop: () => queue.stop('notification'),
  getStats: () => queue.getStats('notification'),
};

export const paymentQueue = {
  add: <T>(jobType: string, data: T, options?: QueueOptions) =>
    queue.add('payment', jobType, data, options),
  process: (concurrency?: number) => queue.process('payment', concurrency),
  stop: () => queue.stop('payment'),
  getStats: () => queue.getStats('payment'),
};

export const escrowQueue = {
  add: <T>(jobType: string, data: T, options?: QueueOptions) =>
    queue.add('escrow', jobType, data, options),
  process: (concurrency?: number) => queue.process('escrow', concurrency),
  stop: () => queue.stop('escrow'),
  getStats: () => queue.getStats('escrow'),
};

// Convenience functions
export const addJob = <T>(queue: string, jobType: string, data: T, options?: QueueOptions) =>
  QueueSystem.getInstance().add(queue, jobType, data, options);

export const registerJobHandler = <T>(jobType: string, handler: JobHandler<T>) =>
  QueueSystem.getInstance().registerHandler(jobType, handler);

export const processQueue = (queueName: string, concurrency?: number) =>
  QueueSystem.getInstance().process(queueName, concurrency);

export const stopQueue = (queueName?: string) =>
  QueueSystem.getInstance().stop(queueName);

// Example usage
export const exampleUsage = () => {
  // Register handlers
  queue.registerHandler('send-email', async (job) => {
    const { to, subject, body } = job.data;
    console.log(`Sending email to ${to}: ${subject}`);
    // Send email logic
    return { sent: true };
  });

  queue.registerHandler('process-payment', async (job) => {
    const { amount, userId } = job.data;
    console.log(`Processing payment of ${amount} for user ${userId}`);
    // Payment processing logic
    return { transactionId: '123' };
  });

  // Add jobs
  emailQueue.add('send-email', {
    to: 'user@example.com',
    subject: 'Welcome',
    body: 'Welcome to our platform!',
  });

  paymentQueue.add(
    'process-payment',
    { amount: 100, userId: 'user123' },
    { priority: JobPriority.HIGH }
  );

  // Start processing
  emailQueue.process(2); // 2 concurrent workers
  paymentQueue.process(1);
};

