-- Tags System Migration
-- Creates tags table and adds tags columns to entity tables

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#A2B758',
  entity_type TEXT NOT NULL DEFAULT 'all',  -- 'all' = universal tags across entities
  usage_count INTEGER DEFAULT 0,            -- Track popularity for suggestions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tag_name)  -- Case-sensitive unique
);

-- Add tags columns to entity tables
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add tags to Insightly integration tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create GIN indexes for efficient tag queries
CREATE INDEX IF NOT EXISTS idx_accounts_tags ON accounts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_deals_tags ON deals USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_interactions_tags ON interactions USING GIN(tags);

-- Create indexes for tags table
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_tags_entity_type ON tags(entity_type);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

-- Function to increment tag usage count
CREATE OR REPLACE FUNCTION increment_tag_usage(tag_names TEXT[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tags
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE tag_name = ANY(tag_names);
END;
$$;

-- Function to decrement tag usage count
CREATE OR REPLACE FUNCTION decrement_tag_usage(tag_names TEXT[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tags
  SET usage_count = GREATEST(usage_count - 1, 0),
      updated_at = NOW()
  WHERE tag_name = ANY(tag_names);
END;
$$;

-- Trigger to update updated_at on tags
CREATE OR REPLACE FUNCTION update_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tags_updated_at();

