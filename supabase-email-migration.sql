-- Migration: Add email notifications support
-- Run this in your Supabase SQL Editor

-- Add email column to recipients table
ALTER TABLE recipients
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT false;

-- Add email preferences to splits table
ALTER TABLE splits
ADD COLUMN IF NOT EXISTS owner_email TEXT,
ADD COLUMN IF NOT EXISTS owner_email_notifications BOOLEAN DEFAULT false;

-- Create email_logs table to track sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID REFERENCES splits(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'distribution', 'split_created', etc.
  tx_hash TEXT,
  amount TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'bounced'
  error_message TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_split ON email_logs(split_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_recipients_email ON recipients(email);

-- Add comments
COMMENT ON COLUMN recipients.email IS 'Recipient email address for notifications';
COMMENT ON COLUMN recipients.email_notifications IS 'Whether the recipient wants email notifications';
COMMENT ON COLUMN splits.owner_email IS 'Split owner email for notifications';
COMMENT ON COLUMN splits.owner_email_notifications IS 'Whether owner wants email notifications';
COMMENT ON TABLE email_logs IS 'Log of all emails sent by the system';

