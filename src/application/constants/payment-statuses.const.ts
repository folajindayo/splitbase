/**
 * Payment Status Constants
 */

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export type PaymentStatusType = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES];

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  executing: 'Executing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  executing: '#3B82F6',
  completed: '#10B981',
  failed: '#EF4444',
  cancelled: '#6B7280',
};


