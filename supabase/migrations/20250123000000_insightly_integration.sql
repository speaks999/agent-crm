-- Add insightly_id to existing tables
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS insightly_id BIGINT UNIQUE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS insightly_id BIGINT UNIQUE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS insightly_id BIGINT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_insightly_id ON accounts(insightly_id);
CREATE INDEX IF NOT EXISTS idx_contacts_insightly_id ON contacts(insightly_id);
CREATE INDEX IF NOT EXISTS idx_deals_insightly_id ON deals(insightly_id);

-- Organizations table (mirrors Insightly Organizations)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insightly_id BIGINT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    background TEXT,
    image_url TEXT,
    owner_user_id BIGINT,
    date_created_utc TIMESTAMPTZ,
    date_updated_utc TIMESTAMPTZ,
    visible_to TEXT,
    visible_team_id BIGINT,
    visible_user_ids TEXT,
    customfields JSONB,
    address_billing_street TEXT,
    address_billing_city TEXT,
    address_billing_state TEXT,
    address_billing_postcode TEXT,
    address_billing_country TEXT,
    address_ship_street TEXT,
    address_ship_city TEXT,
    address_ship_state TEXT,
    address_ship_postcode TEXT,
    address_ship_country TEXT,
    phone TEXT,
    phone_fax TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insightly_id BIGINT UNIQUE NOT NULL,
    project_name TEXT NOT NULL,
    status TEXT,
    project_details TEXT,
    completed BOOLEAN DEFAULT FALSE,
    started_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    owner_user_id BIGINT,
    category_id BIGINT,
    pipeline_id BIGINT,
    stage_id BIGINT,
    image_url TEXT,
    responsible_user_id BIGINT,
    opportunity_id BIGINT,
    customfields JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insightly_id BIGINT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category_id BIGINT,
    due_date TIMESTAMPTZ,
    completed_date_utc TIMESTAMPTZ,
    publicly_visible BOOLEAN DEFAULT TRUE,
    completed BOOLEAN DEFAULT FALSE,
    project_id BIGINT,
    opportunity_id BIGINT,
    milestone_id BIGINT,
    pipeline_id BIGINT,
    stage_id BIGINT,
    details TEXT,
    status TEXT,
    priority INTEGER,
    percent_complete INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    assigned_by_user_id BIGINT,
    parent_task_id BIGINT,
    owner_visible BOOLEAN DEFAULT TRUE,
    responsible_user_id BIGINT,
    owner_user_id BIGINT,
    date_created_utc TIMESTAMPTZ,
    date_updated_utc TIMESTAMPTZ,
    reminder_date_utc TIMESTAMPTZ,
    reminder_sent BOOLEAN DEFAULT FALSE,
    customfields JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insightly_id BIGINT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    details TEXT,
    start_date_utc TIMESTAMPTZ NOT NULL,
    end_date_utc TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    publicly_visible BOOLEAN DEFAULT TRUE,
    reminder_date_utc TIMESTAMPTZ,
    reminder_sent BOOLEAN DEFAULT FALSE,
    event_type TEXT,
    owner_user_id BIGINT,
    date_created_utc TIMESTAMPTZ,
    date_updated_utc TIMESTAMPTZ,
    customfields JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insightly_id BIGINT UNIQUE NOT NULL,
    opportunity_name TEXT NOT NULL,
    opportunity_details TEXT,
    probability INTEGER,
    bid_currency TEXT,
    bid_amount DECIMAL(15, 2),
    bid_type TEXT,
    bid_duration INTEGER,
    actual_close_date TIMESTAMPTZ,
    category_id BIGINT,
    pipeline_id BIGINT,
    stage_id BIGINT,
    image_url TEXT,
    responsible_user_id BIGINT,
    owner_user_id BIGINT,
    date_created_utc TIMESTAMPTZ,
    date_updated_utc TIMESTAMPTZ,
    opportunity_state TEXT,
    opportunity_value DECIMAL(15, 2),
    forecast_close_date TIMESTAMPTZ,
    customfields JSONB,
    visible_to TEXT,
    visible_team_id BIGINT,
    visible_user_ids TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insightly_user_id BIGINT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- admin, manager, member
    avatar_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    timezone_id TEXT,
    date_created_utc TIMESTAMPTZ,
    date_updated_utc TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync status tracking table
CREATE TABLE IF NOT EXISTS sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- organizations, projects, tasks, events, opportunities, contacts
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT, -- success, error, in_progress
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_insightly_id ON organizations(insightly_id);
CREATE INDEX IF NOT EXISTS idx_projects_insightly_id ON projects(insightly_id);
CREATE INDEX IF NOT EXISTS idx_tasks_insightly_id ON tasks(insightly_id);
CREATE INDEX IF NOT EXISTS idx_events_insightly_id ON events(insightly_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_insightly_id ON opportunities(insightly_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date_utc);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
