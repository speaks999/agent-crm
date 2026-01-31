-- Multi-Team Support Migration
-- This migration adds support for multiple teams per user with invitations

-- ============================================
-- 1. Create Teams Table
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE, -- URL-friendly identifier
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for owner lookup
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);

-- ============================================
-- 2. Create Team Memberships Table
-- ============================================
CREATE TABLE IF NOT EXISTS team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Create indexes for membership lookups
CREATE INDEX IF NOT EXISTS idx_team_memberships_team_id ON team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user_id ON team_memberships(user_id);

-- ============================================
-- 3. Create Team Invites Table
-- ============================================
CREATE TABLE IF NOT EXISTS team_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- admin, member
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, email, status) -- Only one pending invite per email per team
);

-- Create indexes for invite lookups
CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites(status);

-- ============================================
-- 4. Add team_id to existing entity tables
-- ============================================
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- Create indexes for team_id on all entity tables
CREATE INDEX IF NOT EXISTS idx_accounts_team_id ON accounts(team_id);
CREATE INDEX IF NOT EXISTS idx_contacts_team_id ON contacts(team_id);
CREATE INDEX IF NOT EXISTS idx_deals_team_id ON deals(team_id);
CREATE INDEX IF NOT EXISTS idx_interactions_team_id ON interactions(team_id);
CREATE INDEX IF NOT EXISTS idx_pipelines_team_id ON pipelines(team_id);
CREATE INDEX IF NOT EXISTS idx_tags_team_id ON tags(team_id);

-- ============================================
-- 5. Update team_members to link to teams
-- ============================================
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- ============================================
-- 6. Add current_team_id to track user's active team
-- ============================================
CREATE TABLE IF NOT EXISTS user_team_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_team_prefs_user_id ON user_team_preferences(user_id);

-- ============================================
-- 7. Helper function to generate slug from team name
-- ============================================
CREATE OR REPLACE FUNCTION generate_team_slug(team_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase and replace spaces/special chars with hyphens
    base_slug := lower(regexp_replace(team_name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Remove leading/trailing hyphens
    base_slug := trim(both '-' from base_slug);
    
    final_slug := base_slug;
    
    -- Check for uniqueness and append number if needed
    WHILE EXISTS (SELECT 1 FROM teams WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Trigger to auto-generate slug on team creation
-- ============================================
CREATE OR REPLACE FUNCTION set_team_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_team_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_team_slug ON teams;
CREATE TRIGGER trigger_set_team_slug
    BEFORE INSERT ON teams
    FOR EACH ROW
    EXECUTE FUNCTION set_team_slug();

-- ============================================
-- 9. Function to create default team for new user
-- ============================================
CREATE OR REPLACE FUNCTION create_default_team_for_user(
    p_user_id UUID,
    p_user_email TEXT
)
RETURNS UUID AS $$
DECLARE
    v_team_id UUID;
    v_team_name TEXT;
BEGIN
    -- Generate team name from email (e.g., "john@example.com" -> "John's Team")
    v_team_name := initcap(split_part(p_user_email, '@', 1)) || '''s Team';
    
    -- Create the team
    INSERT INTO teams (name, owner_id)
    VALUES (v_team_name, p_user_id)
    RETURNING id INTO v_team_id;
    
    -- Add user as owner in memberships
    INSERT INTO team_memberships (team_id, user_id, role)
    VALUES (v_team_id, p_user_id, 'owner');
    
    -- Set as current team
    INSERT INTO user_team_preferences (user_id, current_team_id)
    VALUES (p_user_id, v_team_id)
    ON CONFLICT (user_id) DO UPDATE SET current_team_id = v_team_id;
    
    RETURN v_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. RLS Policies for teams
-- ============================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Users can see teams they're members of
CREATE POLICY "Users can view their teams" ON teams
    FOR SELECT USING (
        id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid())
    );

-- Only owner can update team
CREATE POLICY "Team owners can update their teams" ON teams
    FOR UPDATE USING (owner_id = auth.uid());

-- Only owner can delete team
CREATE POLICY "Team owners can delete their teams" ON teams
    FOR DELETE USING (owner_id = auth.uid());

-- Users can create teams
CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- ============================================
-- 11. RLS Policies for team_memberships
-- ============================================
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;

-- Users can see memberships of their teams
CREATE POLICY "Users can view team memberships" ON team_memberships
    FOR SELECT USING (
        team_id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid())
    );

-- Only team owners/admins can add members
CREATE POLICY "Team admins can add members" ON team_memberships
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT team_id FROM team_memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Only team owners/admins can remove members (except themselves)
CREATE POLICY "Team admins can remove members" ON team_memberships
    FOR DELETE USING (
        team_id IN (
            SELECT team_id FROM team_memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- 12. RLS Policies for team_invites
-- ============================================
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Users can see invites for their email or invites they sent
CREATE POLICY "Users can view relevant invites" ON team_invites
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR invited_by = auth.uid()
        OR team_id IN (SELECT team_id FROM team_memberships WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

-- Team admins can create invites
CREATE POLICY "Team admins can create invites" ON team_invites
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT team_id FROM team_memberships 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Invitees can update their own invites (accept/decline)
CREATE POLICY "Invitees can update their invites" ON team_invites
    FOR UPDATE USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- ============================================
-- 13. Updated timestamps trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_teams_updated_at ON teams;
CREATE TRIGGER trigger_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_team_memberships_updated_at ON team_memberships;
CREATE TRIGGER trigger_team_memberships_updated_at
    BEFORE UPDATE ON team_memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_team_invites_updated_at ON team_invites;
CREATE TRIGGER trigger_team_invites_updated_at
    BEFORE UPDATE ON team_invites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_user_team_prefs_updated_at ON user_team_preferences;
CREATE TRIGGER trigger_user_team_prefs_updated_at
    BEFORE UPDATE ON user_team_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

