-- Add assigned_to column to CRM entities for team member assignment
-- This enables assigning deals, contacts, accounts, and interactions to team members

-- Add assigned_to to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Add assigned_to to contacts table  
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Add assigned_to to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Add assigned_to to interactions table
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- Create indexes for efficient filtering by assignee
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_accounts_assigned_to ON accounts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_interactions_assigned_to ON interactions(assigned_to);

-- Add RLS policies for team-based access (optional, can be enabled later)
-- These are commented out for now as they require auth integration
-- ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their assigned deals" ON deals FOR SELECT USING (assigned_to = auth.uid());

