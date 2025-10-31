-- SplitBase Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Create splits table
CREATE TABLE IF NOT EXISTS splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT NOT NULL UNIQUE,
  owner_address TEXT NOT NULL,
  factory_address TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Split',
  description TEXT,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipients table
CREATE TABLE IF NOT EXISTS recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID NOT NULL REFERENCES splits(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_splits_owner ON splits(owner_address);
CREATE INDEX IF NOT EXISTS idx_splits_contract ON splits(contract_address);
CREATE INDEX IF NOT EXISTS idx_recipients_split ON recipients(split_id);

-- Enable Row Level Security (RLS)
ALTER TABLE splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access
CREATE POLICY "Allow public read access on splits" 
  ON splits FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert on splits" 
  ON splits FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public read access on recipients" 
  ON recipients FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert on recipients" 
  ON recipients FOR INSERT 
  WITH CHECK (true);

-- Note: For production, you should implement proper authentication
-- and restrict these policies to authenticated users only

