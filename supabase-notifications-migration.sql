-- Migration: Create custody notifications table
-- Run this in your Supabase SQL Editor

-- Create custody_notifications table
CREATE TABLE IF NOT EXISTS custody_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (
    type IN (
      'low_balance',
      'large_deposit',
      'large_release',
      'suspicious_activity',
      'system_alert',
      'health_warning',
      'backup_required'
    )
  ),
  severity TEXT NOT NULL CHECK (
    severity IN ('info', 'warning', 'critical')
  ),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  escrow_id UUID REFERENCES escrows(id) ON DELETE CASCADE,
  custody_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_read ON custody_notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_severity ON custody_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON custody_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON custody_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_escrow_id ON custody_notifications(escrow_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread_severity ON custody_notifications(read, severity) WHERE read = false;

-- Add comments for documentation
COMMENT ON TABLE custody_notifications IS 'Admin notifications for custody system events and alerts';
COMMENT ON COLUMN custody_notifications.type IS 'Type of notification event';
COMMENT ON COLUMN custody_notifications.severity IS 'Notification severity level';
COMMENT ON COLUMN custody_notifications.title IS 'Short notification title';
COMMENT ON COLUMN custody_notifications.message IS 'Detailed notification message';
COMMENT ON COLUMN custody_notifications.escrow_id IS 'Related escrow if applicable';
COMMENT ON COLUMN custody_notifications.custody_address IS 'Related custody wallet address if applicable';
COMMENT ON COLUMN custody_notifications.metadata IS 'Additional notification data';
COMMENT ON COLUMN custody_notifications.read IS 'Whether notification has been read';

-- Enable Row Level Security (RLS)
ALTER TABLE custody_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Service role can insert notifications
CREATE POLICY "Service role can insert notifications" ON custody_notifications
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policy: Admins can view all notifications
-- CREATE POLICY "Admins can view all notifications" ON custody_notifications
--   FOR SELECT
--   USING (auth.jwt()->>'role' = 'admin');

-- Create RLS policy: Admins can update notifications
-- CREATE POLICY "Admins can update notifications" ON custody_notifications
--   FOR UPDATE
--   USING (auth.jwt()->>'role' = 'admin');

-- Function to automatically delete old read notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM custody_notifications
  WHERE read = true
  AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup (requires pg_cron extension - optional)
-- SELECT cron.schedule('cleanup-notifications', '0 3 * * *', 'SELECT cleanup_old_notifications()');

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM custody_notifications
  WHERE read = false;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get critical notification count
CREATE OR REPLACE FUNCTION get_critical_notification_count()
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM custody_notifications
  WHERE read = false
  AND severity = 'critical';
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

