-- ============================================
-- Fix team_members constraints for multi-team support
--
-- The original table had UNIQUE(email), which prevents the same user
-- from appearing in multiple teams.  Replace it with
-- UNIQUE(team_id, user_id) so each user can belong to many teams
-- but only once per team.
-- ============================================

-- Drop the legacy single-column unique constraint on email.
-- The default PostgreSQL name for  "email TEXT UNIQUE"  is  team_members_email_key.
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_email_key;

-- Add composite unique so a user can only appear once per team.
-- "IF NOT EXISTS" isn't supported for constraints, so use DO block.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_members_team_user_unique'
  ) THEN
    ALTER TABLE team_members
      ADD CONSTRAINT team_members_team_user_unique UNIQUE (team_id, user_id);
  END IF;
END$$;
