-- Migration: Add templates table
-- Run this in your Supabase SQL Editor

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_preset BOOLEAN DEFAULT false,
  owner_address TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);

-- Create template_recipients table
CREATE TABLE IF NOT EXISTS template_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  wallet_address TEXT,
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  label TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_owner ON templates(owner_address);
CREATE INDEX IF NOT EXISTS idx_templates_preset ON templates(is_preset);
CREATE INDEX IF NOT EXISTS idx_template_recipients_template ON template_recipients(template_id);

-- Add comments
COMMENT ON TABLE templates IS 'Split contract templates (preset and user-created)';
COMMENT ON TABLE template_recipients IS 'Recipients configuration for templates';

-- Insert preset templates
INSERT INTO templates (name, description, is_preset, icon, owner_address) VALUES
('50/50 Split', 'Equal split between two recipients', true, '🤝', NULL),
('Equal Thirds', 'Split evenly between three recipients', true, '🎯', NULL),
('Team Revenue (4)', 'Split between 4 team members', true, '👥', NULL),
('Creator Split (80/20)', 'Creator gets 80%, platform/partner gets 20%', true, '🎨', NULL),
('DAO Treasury Split', 'Multi-member DAO distribution', true, '🏛️', NULL),
('Founder Split (3)', 'Equal split between 3 co-founders', true, '🚀', NULL)
ON CONFLICT DO NOTHING;

-- Get the template IDs (you'll need to run this after the insert)
DO $$
DECLARE
  template_50_50 UUID;
  template_thirds UUID;
  template_team UUID;
  template_creator UUID;
  template_dao UUID;
  template_founders UUID;
BEGIN
  -- 50/50 Split
  SELECT id INTO template_50_50 FROM templates WHERE name = '50/50 Split' AND is_preset = true LIMIT 1;
  IF template_50_50 IS NOT NULL THEN
    INSERT INTO template_recipients (template_id, wallet_address, percentage, label) VALUES
    (template_50_50, NULL, 50, 'Recipient 1'),
    (template_50_50, NULL, 50, 'Recipient 2')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Equal Thirds
  SELECT id INTO template_thirds FROM templates WHERE name = 'Equal Thirds' AND is_preset = true LIMIT 1;
  IF template_thirds IS NOT NULL THEN
    INSERT INTO template_recipients (template_id, wallet_address, percentage, label) VALUES
    (template_thirds, NULL, 33, 'Recipient 1'),
    (template_thirds, NULL, 33, 'Recipient 2'),
    (template_thirds, NULL, 34, 'Recipient 3')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Team Revenue (4)
  SELECT id INTO template_team FROM templates WHERE name = 'Team Revenue (4)' AND is_preset = true LIMIT 1;
  IF template_team IS NOT NULL THEN
    INSERT INTO template_recipients (template_id, wallet_address, percentage, label) VALUES
    (template_team, NULL, 25, 'Team Member 1'),
    (template_team, NULL, 25, 'Team Member 2'),
    (template_team, NULL, 25, 'Team Member 3'),
    (template_team, NULL, 25, 'Team Member 4')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Creator Split (80/20)
  SELECT id INTO template_creator FROM templates WHERE name = 'Creator Split (80/20)' AND is_preset = true LIMIT 1;
  IF template_creator IS NOT NULL THEN
    INSERT INTO template_recipients (template_id, wallet_address, percentage, label) VALUES
    (template_creator, NULL, 80, 'Creator'),
    (template_creator, NULL, 20, 'Platform/Partner')
    ON CONFLICT DO NOTHING;
  END IF;

  -- DAO Treasury Split
  SELECT id INTO template_dao FROM templates WHERE name = 'DAO Treasury Split' AND is_preset = true LIMIT 1;
  IF template_dao IS NOT NULL THEN
    INSERT INTO template_recipients (template_id, wallet_address, percentage, label) VALUES
    (template_dao, NULL, 40, 'Core Team'),
    (template_dao, NULL, 30, 'Community Treasury'),
    (template_dao, NULL, 20, 'Development Fund'),
    (template_dao, NULL, 10, 'Marketing')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Founder Split (3)
  SELECT id INTO template_founders FROM templates WHERE name = 'Founder Split (3)' AND is_preset = true LIMIT 1;
  IF template_founders IS NOT NULL THEN
    INSERT INTO template_recipients (template_id, wallet_address, percentage, label) VALUES
    (template_founders, NULL, 33, 'Co-Founder 1'),
    (template_founders, NULL, 33, 'Co-Founder 2'),
    (template_founders, NULL, 34, 'Co-Founder 3')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

