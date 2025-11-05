-- Migration: Add custody wallet fields to escrows table
-- Run this in your Supabase SQL Editor

-- Add encrypted private key column for custody wallets
ALTER TABLE escrows
ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT,
ADD COLUMN IF NOT EXISTS custody_wallet_address TEXT;

-- Add comments for documentation
COMMENT ON COLUMN escrows.encrypted_private_key IS 'Encrypted private key for the escrow custody wallet';
COMMENT ON COLUMN escrows.custody_wallet_address IS 'Unique wallet address where funds are held in custody';

-- Create index for faster lookup by custody wallet address
CREATE INDEX IF NOT EXISTS idx_escrows_custody_wallet ON escrows(custody_wallet_address);

-- Update existing deposit_address to custody_wallet_address where applicable
-- (Optional: only if you want to migrate existing data)
-- UPDATE escrows SET custody_wallet_address = deposit_address WHERE custody_wallet_address IS NULL;

