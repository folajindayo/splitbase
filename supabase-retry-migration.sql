-- Migration: Create retryable transactions table
-- Run this in your Supabase SQL Editor

-- Create retryable_transactions table
CREATE TABLE IF NOT EXISTS retryable_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN ('release', 'refund', 'milestone')
  ),
  recipient_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_retry_status ON retryable_transactions(status);
CREATE INDEX IF NOT EXISTS idx_retry_escrow_id ON retryable_transactions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_retry_created_at ON retryable_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_retry_pending ON retryable_transactions(status, attempts, created_at) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_retry_type ON retryable_transactions(transaction_type);

-- Add comments for documentation
COMMENT ON TABLE retryable_transactions IS 'Stores failed custody transactions for automatic retry';
COMMENT ON COLUMN retryable_transactions.escrow_id IS 'Reference to the related escrow';
COMMENT ON COLUMN retryable_transactions.transaction_type IS 'Type of transaction (release, refund, or milestone)';
COMMENT ON COLUMN retryable_transactions.recipient_address IS 'Destination wallet address';
COMMENT ON COLUMN retryable_transactions.amount IS 'Transaction amount in wei';
COMMENT ON COLUMN retryable_transactions.chain_id IS 'Blockchain network ID';
COMMENT ON COLUMN retryable_transactions.attempts IS 'Number of retry attempts made';
COMMENT ON COLUMN retryable_transactions.max_attempts IS 'Maximum number of retry attempts allowed';
COMMENT ON COLUMN retryable_transactions.last_error IS 'Error message from last failed attempt';
COMMENT ON COLUMN retryable_transactions.status IS 'Current status of the retry transaction';

-- Enable Row Level Security (RLS)
ALTER TABLE retryable_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Service role can insert retry transactions
CREATE POLICY "Service role can insert retry transactions" ON retryable_transactions
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policy: Service role can update retry transactions
CREATE POLICY "Service role can update retry transactions" ON retryable_transactions
  FOR UPDATE
  USING (true);

-- Create RLS policy: Service role can select retry transactions
CREATE POLICY "Service role can select retry transactions" ON retryable_transactions
  FOR SELECT
  USING (true);

-- Create RLS policy: Service role can delete retry transactions
CREATE POLICY "Service role can delete retry transactions" ON retryable_transactions
  FOR DELETE
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_retry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on row update
CREATE TRIGGER retry_updated_at_trigger
  BEFORE UPDATE ON retryable_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_retry_updated_at();

-- Function to get retry statistics
CREATE OR REPLACE FUNCTION get_retry_stats()
RETURNS TABLE(
  status TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.status,
    COUNT(*)::BIGINT
  FROM retryable_transactions r
  GROUP BY r.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old retry transactions (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_retry_transactions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM retryable_transactions
  WHERE status IN ('completed', 'failed')
  AND updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension - optional)
-- SELECT cron.schedule('cleanup-retry-transactions', '0 4 * * *', 'SELECT cleanup_old_retry_transactions()');

