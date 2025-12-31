-- Add due_date column to interactions table for task scheduling
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;

-- Add title column for better task naming
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS title text;

-- Create index for efficient due_date queries
CREATE INDEX IF NOT EXISTS idx_interactions_due_date ON interactions(due_date) WHERE due_date IS NOT NULL;

