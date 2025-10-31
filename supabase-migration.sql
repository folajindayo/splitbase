-- Migration: Add new columns to splits table
-- Run this in your Supabase SQL Editor

-- Add new columns to existing splits table
ALTER TABLE splits 
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Untitled Split',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update existing rows to have default values
UPDATE splits 
SET name = 'Untitled Split'
WHERE name IS NULL OR name = '';

-- Add comment for documentation
COMMENT ON COLUMN splits.name IS 'Custom name for the split contract';
COMMENT ON COLUMN splits.description IS 'Optional description for the split';
COMMENT ON COLUMN splits.is_favorite IS 'Whether the split is marked as favorite by the owner';
COMMENT ON COLUMN splits.tags IS 'Optional tags for categorization';

