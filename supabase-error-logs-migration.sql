-- Migration: Create error logs table
-- Run this in your Supabase SQL Editor

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL CHECK (
    error_type IN ('api', 'custody', 'database', 'network', 'validation', 'unknown')
  ),
  severity TEXT NOT NULL CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),
  message TEXT NOT NULL,
  stack_trace TEXT,
  user_address TEXT,
  escrow_id UUID REFERENCES escrows(id) ON DELETE SET NULL,
  endpoint TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_escrow_id ON error_logs(escrow_id);
CREATE INDEX IF NOT EXISTS idx_error_user_address ON error_logs(user_address);
CREATE INDEX IF NOT EXISTS idx_error_endpoint ON error_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_error_critical_unresolved ON error_logs(severity, resolved, timestamp DESC)
  WHERE resolved = false AND severity IN ('high', 'critical');
CREATE INDEX IF NOT EXISTS idx_error_type_timestamp ON error_logs(error_type, timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE error_logs IS 'Centralized error logging and tracking';
COMMENT ON COLUMN error_logs.error_type IS 'Category of error (api, custody, database, network, validation, unknown)';
COMMENT ON COLUMN error_logs.severity IS 'Severity level (low, medium, high, critical)';
COMMENT ON COLUMN error_logs.message IS 'Error message';
COMMENT ON COLUMN error_logs.stack_trace IS 'Full error stack trace for debugging';
COMMENT ON COLUMN error_logs.user_address IS 'Wallet address of user who triggered error (if applicable)';
COMMENT ON COLUMN error_logs.escrow_id IS 'Related escrow ID (if applicable)';
COMMENT ON COLUMN error_logs.endpoint IS 'API endpoint where error occurred';
COMMENT ON COLUMN error_logs.metadata IS 'Additional error context and data';
COMMENT ON COLUMN error_logs.resolved IS 'Whether the error has been addressed';
COMMENT ON COLUMN error_logs.resolved_at IS 'When the error was resolved';
COMMENT ON COLUMN error_logs.resolved_by IS 'Who resolved the error';

-- Enable Row Level Security (RLS)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Service role can insert errors
CREATE POLICY "Service role can insert errors" ON error_logs
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policy: Service role can select errors
CREATE POLICY "Service role can select errors" ON error_logs
  FOR SELECT
  USING (true);

-- Create RLS policy: Service role can update errors
CREATE POLICY "Service role can update errors" ON error_logs
  FOR UPDATE
  USING (true);

-- Create RLS policy: Service role can delete errors
CREATE POLICY "Service role can delete errors" ON error_logs
  FOR DELETE
  USING (true);

-- Function to get error summary
CREATE OR REPLACE FUNCTION get_error_summary(
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
  total_errors BIGINT,
  unresolved_count BIGINT,
  critical_count BIGINT,
  high_count BIGINT,
  by_type JSONB,
  by_severity JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_errors,
    COUNT(*) FILTER (WHERE el.resolved = false)::BIGINT as unresolved_count,
    COUNT(*) FILTER (WHERE el.severity = 'critical')::BIGINT as critical_count,
    COUNT(*) FILTER (WHERE el.severity = 'high')::BIGINT as high_count,
    jsonb_object_agg(
      el.error_type, 
      (SELECT COUNT(*) FROM error_logs WHERE error_type = el.error_type AND timestamp >= NOW() - (p_hours || ' hours')::INTERVAL)
    ) as by_type,
    jsonb_object_agg(
      el.severity,
      (SELECT COUNT(*) FROM error_logs WHERE severity = el.severity AND timestamp >= NOW() - (p_hours || ' hours')::INTERVAL)
    ) as by_severity
  FROM error_logs el
  WHERE el.timestamp >= NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY ();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old resolved errors (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM error_logs
  WHERE resolved = true
  AND timestamp < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get error trends
CREATE OR REPLACE FUNCTION get_error_trends(
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  date DATE,
  total_count BIGINT,
  critical_count BIGINT,
  high_count BIGINT,
  unresolved_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(el.timestamp) as date,
    COUNT(*)::BIGINT as total_count,
    COUNT(*) FILTER (WHERE el.severity = 'critical')::BIGINT as critical_count,
    COUNT(*) FILTER (WHERE el.severity = 'high')::BIGINT as high_count,
    COUNT(*) FILTER (WHERE el.resolved = false)::BIGINT as unresolved_count
  FROM error_logs el
  WHERE el.timestamp >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  GROUP BY DATE(el.timestamp)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to alert on critical errors
CREATE OR REPLACE FUNCTION check_critical_errors()
RETURNS TABLE(
  recent_critical_count BIGINT,
  unresolved_critical_count BIGINT,
  should_alert BOOLEAN
) AS $$
DECLARE
  recent_count BIGINT;
  unresolved_count BIGINT;
BEGIN
  -- Count critical errors in last hour
  SELECT COUNT(*) INTO recent_count
  FROM error_logs
  WHERE severity = 'critical'
  AND timestamp >= NOW() - INTERVAL '1 hour';
  
  -- Count unresolved critical errors
  SELECT COUNT(*) INTO unresolved_count
  FROM error_logs
  WHERE severity = 'critical'
  AND resolved = false;
  
  RETURN QUERY
  SELECT 
    recent_count,
    unresolved_count,
    (recent_count > 5 OR unresolved_count > 10) as should_alert;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension - optional)
-- SELECT cron.schedule('cleanup-error-logs', '0 6 * * *', 'SELECT cleanup_old_error_logs()');

-- Create view for recent critical errors
CREATE OR REPLACE VIEW v_recent_critical_errors AS
SELECT 
  id,
  error_type,
  message,
  user_address,
  escrow_id,
  endpoint,
  timestamp,
  resolved
FROM error_logs
WHERE severity IN ('high', 'critical')
AND resolved = false
AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Grant select on view
-- GRANT SELECT ON v_recent_critical_errors TO authenticated;

