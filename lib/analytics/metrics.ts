/**
 * Analytics Metrics
 */

export const METRICS = {
  SPLIT_CREATED: 'split_created',
  SPLIT_EXECUTED: 'split_executed',
  RECIPIENT_ADDED: 'recipient_added',
  AMOUNT_SPLIT: 'amount_split',
} as const;

export function logMetric(metric: string, value?: number, tags?: Record<string, string>) {
  if (typeof window === 'undefined') return;
  
  console.log('Metric:', metric, value, tags);
  
  // Metrics integration
}

