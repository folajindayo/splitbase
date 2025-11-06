-- Migration: Create custody audit logs table
-- Run this in your Supabase SQL Editor

-- Create custody_audit_logs table
CREATE TABLE IF NOT EXISTS custody_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (
    action_type IN (
      'wallet_created',
      'key_encrypted', 
      'key_decrypted',
      'balance_checked',
      'funds_released',
      'funds_refunded',
      'milestone_released',
      'auto_funded'
    )
  ),
  actor_address TEXT,
  custody_address TEXT NOT NULL,
  amount TEXT,
  transaction_hash TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_custody_audit_escrow_id ON custody_audit_logs(escrow_id);
CREATE INDEX IF NOT EXISTS idx_custody_audit_custody_address ON custody_audit_logs(custody_address);
CREATE INDEX IF NOT EXISTS idx_custody_audit_action_type ON custody_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_custody_audit_created_at ON custody_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custody_audit_actor ON custody_audit_logs(actor_address);

-- Add comments for documentation
COMMENT ON TABLE custody_audit_logs IS 'Audit trail for all custody wallet operations';
COMMENT ON COLUMN custody_audit_logs.action_type IS 'Type of custody operation performed';
COMMENT ON COLUMN custody_audit_logs.actor_address IS 'Wallet address of user who initiated the action';
COMMENT ON COLUMN custody_audit_logs.custody_address IS 'Custody wallet address involved';
COMMENT ON COLUMN custody_audit_logs.amount IS 'Amount involved in the operation (in ETH)';
COMMENT ON COLUMN custody_audit_logs.transaction_hash IS 'Blockchain transaction hash if applicable';
COMMENT ON COLUMN custody_audit_logs.metadata IS 'Additional operation metadata';
COMMENT ON COLUMN custody_audit_logs.ip_address IS 'IP address of the request (optional)';
COMMENT ON COLUMN custody_audit_logs.user_agent IS 'User agent of the request (optional)';

-- Enable Row Level Security (RLS)
ALTER TABLE custody_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can view audit logs for their own escrows
CREATE POLICY "Users can view their escrow audit logs" ON custody_audit_logs
  FOR SELECT
  USING (
    escrow_id IN (
      SELECT id FROM escrows 
      WHERE buyer_address = lower(auth.jwt()->>'user_address') 
      OR seller_address = lower(auth.jwt()->>'user_address')
    )
  );

-- Create RLS policy: System can insert audit logs (service role)
CREATE POLICY "Service role can insert audit logs" ON custody_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Note: In production, you may want to add an admin policy for full access
-- CREATE POLICY "Admins can view all audit logs" ON custody_audit_logs
--   FOR SELECT
--   USING (auth.jwt()->>'role' = 'admin');

