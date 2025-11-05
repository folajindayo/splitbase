-- Migration: Add escrow system tables
-- Run this in your Supabase SQL Editor

-- Create escrows table
CREATE TABLE IF NOT EXISTS escrows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  buyer_address TEXT NOT NULL,
  seller_address TEXT NOT NULL,
  total_amount DECIMAL(20, 8) NOT NULL,
  currency TEXT DEFAULT 'ETH',
  
  -- Escrow type and status
  escrow_type TEXT NOT NULL CHECK (escrow_type IN ('simple', 'time_locked', 'milestone')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'funded', 'released', 'disputed', 'cancelled', 'expired')),
  
  -- Time lock
  release_date TIMESTAMP WITH TIME ZONE,
  auto_release BOOLEAN DEFAULT false,
  
  -- Tracking
  deposit_address TEXT,
  transaction_hash TEXT,
  funded_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create escrow milestones table
CREATE TABLE IF NOT EXISTS escrow_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(20, 8) NOT NULL,
  order_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'released')),
  completed_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create escrow activities table
CREATE TABLE IF NOT EXISTS escrow_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID NOT NULL REFERENCES escrows(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  actor_address TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrows_buyer ON escrows(buyer_address);
CREATE INDEX IF NOT EXISTS idx_escrows_seller ON escrows(seller_address);
CREATE INDEX IF NOT EXISTS idx_escrows_status ON escrows(status);
CREATE INDEX IF NOT EXISTS idx_escrows_created ON escrows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_milestones_escrow ON escrow_milestones(escrow_id);
CREATE INDEX IF NOT EXISTS idx_milestones_order ON escrow_milestones(escrow_id, order_index);
CREATE INDEX IF NOT EXISTS idx_activities_escrow ON escrow_activities(escrow_id, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE escrows IS 'Escrow agreements between buyers and sellers';
COMMENT ON TABLE escrow_milestones IS 'Milestones for milestone-based escrows';
COMMENT ON TABLE escrow_activities IS 'Activity log for all escrow actions';

COMMENT ON COLUMN escrows.escrow_type IS 'Type: simple, time_locked, or milestone';
COMMENT ON COLUMN escrows.status IS 'Status: pending, funded, released, disputed, cancelled, or expired';
COMMENT ON COLUMN escrows.auto_release IS 'Whether to auto-release after release_date';
COMMENT ON COLUMN escrows.deposit_address IS 'Custodial wallet address where SplitBase holds funds';
COMMENT ON COLUMN escrows.transaction_hash IS 'Blockchain transaction hash of deposit for verification';
COMMENT ON COLUMN escrows.funded_at IS 'Timestamp when funds were deposited and verified';

