-- Migration: Create rate limit tracking table
-- Run this in your Supabase SQL Editor

-- Create custody_rate_limits table for tracking violations
CREATE TABLE IF NOT EXISTS custody_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  violation_count INTEGER DEFAULT 1,
  violated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON custody_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON custody_rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_violated_at ON custody_rate_limits(violated_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_violated ON custody_rate_limits(identifier, violated_at DESC);

-- Add comments for documentation
COMMENT ON TABLE custody_rate_limits IS 'Tracks rate limit violations for custody API endpoints';
COMMENT ON COLUMN custody_rate_limits.identifier IS 'IP address or wallet address of violator';
COMMENT ON COLUMN custody_rate_limits.endpoint IS 'API endpoint that was rate limited';
COMMENT ON COLUMN custody_rate_limits.violation_count IS 'Number of requests that exceeded limit';
COMMENT ON COLUMN custody_rate_limits.violated_at IS 'When the rate limit was violated';

-- Enable Row Level Security (RLS)
ALTER TABLE custody_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Service role can insert violations
CREATE POLICY "Service role can insert rate limit violations" ON custody_rate_limits
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policy: Admins can view all violations
-- CREATE POLICY "Admins can view all rate limit violations" ON custody_rate_limits
--   FOR SELECT
--   USING (auth.jwt()->>'role' = 'admin');

-- Function to clean up old rate limit records (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM custody_rate_limits
  WHERE violated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension - optional)
-- SELECT cron.schedule('cleanup-rate-limits', '0 2 * * *', 'SELECT cleanup_old_rate_limits()');

