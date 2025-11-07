-- Migration: Create performance metrics table
-- Run this in your Supabase SQL Editor

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  duration_ms NUMERIC NOT NULL,
  status_code INTEGER NOT NULL,
  user_address TEXT,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_perf_endpoint ON performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_perf_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_perf_endpoint_timestamp ON performance_metrics(endpoint, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_perf_status ON performance_metrics(status_code);
CREATE INDEX IF NOT EXISTS idx_perf_duration ON performance_metrics(duration_ms DESC);
CREATE INDEX IF NOT EXISTS idx_perf_errors ON performance_metrics(status_code, timestamp DESC) 
  WHERE status_code >= 400;
CREATE INDEX IF NOT EXISTS idx_perf_slow ON performance_metrics(duration_ms DESC, timestamp DESC) 
  WHERE duration_ms >= 2000;

-- Add comments for documentation
COMMENT ON TABLE performance_metrics IS 'Tracks API performance metrics and response times';
COMMENT ON COLUMN performance_metrics.endpoint IS 'API endpoint path';
COMMENT ON COLUMN performance_metrics.method IS 'HTTP method (GET, POST, etc.)';
COMMENT ON COLUMN performance_metrics.duration_ms IS 'Request duration in milliseconds';
COMMENT ON COLUMN performance_metrics.status_code IS 'HTTP response status code';
COMMENT ON COLUMN performance_metrics.user_address IS 'Wallet address of user making request (if available)';
COMMENT ON COLUMN performance_metrics.error_message IS 'Error message if request failed';
COMMENT ON COLUMN performance_metrics.metadata IS 'Additional performance metadata';

-- Enable Row Level Security (RLS)
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Service role can insert metrics
CREATE POLICY "Service role can insert metrics" ON performance_metrics
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policy: Service role can select metrics
CREATE POLICY "Service role can select metrics" ON performance_metrics
  FOR SELECT
  USING (true);

-- Create RLS policy: Service role can delete metrics
CREATE POLICY "Service role can delete metrics" ON performance_metrics
  FOR DELETE
  USING (true);

-- Function to get endpoint statistics
CREATE OR REPLACE FUNCTION get_endpoint_performance_stats(
  p_endpoint TEXT,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  endpoint TEXT,
  total_requests BIGINT,
  avg_duration NUMERIC,
  min_duration NUMERIC,
  max_duration NUMERIC,
  error_rate NUMERIC,
  p50_duration NUMERIC,
  p95_duration NUMERIC,
  p99_duration NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH endpoint_metrics AS (
    SELECT 
      pm.endpoint,
      pm.duration_ms,
      pm.status_code,
      ROW_NUMBER() OVER (ORDER BY pm.duration_ms) as row_num,
      COUNT(*) OVER () as total_count
    FROM performance_metrics pm
    WHERE pm.endpoint = p_endpoint
    AND pm.timestamp >= NOW() - (p_hours || ' hours')::INTERVAL
  )
  SELECT 
    p_endpoint,
    COUNT(*)::BIGINT as total_requests,
    ROUND(AVG(em.duration_ms), 2) as avg_duration,
    MIN(em.duration_ms) as min_duration,
    MAX(em.duration_ms) as max_duration,
    ROUND((COUNT(*) FILTER (WHERE em.status_code >= 400)::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as error_rate,
    (SELECT duration_ms FROM endpoint_metrics WHERE row_num = CEIL(total_count * 0.5)) as p50_duration,
    (SELECT duration_ms FROM endpoint_metrics WHERE row_num = CEIL(total_count * 0.95)) as p95_duration,
    (SELECT duration_ms FROM endpoint_metrics WHERE row_num = CEIL(total_count * 0.99)) as p99_duration
  FROM endpoint_metrics em
  GROUP BY p_endpoint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old performance metrics (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_performance_metrics()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM performance_metrics
  WHERE timestamp < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system performance summary
CREATE OR REPLACE FUNCTION get_system_performance_summary(
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  total_requests BIGINT,
  avg_duration NUMERIC,
  error_rate NUMERIC,
  slow_requests_count BIGINT,
  unique_endpoints INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_requests,
    ROUND(AVG(pm.duration_ms), 2) as avg_duration,
    ROUND((COUNT(*) FILTER (WHERE pm.status_code >= 400)::NUMERIC / COUNT(*)::NUMERIC * 100), 2) as error_rate,
    COUNT(*) FILTER (WHERE pm.duration_ms >= 2000)::BIGINT as slow_requests_count,
    COUNT(DISTINCT pm.endpoint)::INTEGER as unique_endpoints
  FROM performance_metrics pm
  WHERE pm.timestamp >= NOW() - (p_hours || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension - optional)
-- SELECT cron.schedule('cleanup-performance-metrics', '0 5 * * *', 'SELECT cleanup_old_performance_metrics()');

-- Create materialized view for faster aggregations (optional, requires manual refresh)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_performance_summary AS
SELECT 
  endpoint,
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as request_count,
  ROUND(AVG(duration_ms), 2) as avg_duration,
  MIN(duration_ms) as min_duration,
  MAX(duration_ms) as max_duration,
  COUNT(*) FILTER (WHERE status_code >= 400) as error_count
FROM performance_metrics
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY endpoint, DATE_TRUNC('hour', timestamp);

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_perf_endpoint_hour ON mv_performance_summary(endpoint, hour DESC);

-- Function to refresh performance summary
CREATE OR REPLACE FUNCTION refresh_performance_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_performance_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule materialized view refresh (optional)
-- SELECT cron.schedule('refresh-performance-summary', '0 * * * *', 'SELECT refresh_performance_summary()');

