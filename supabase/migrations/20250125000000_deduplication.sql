-- Deduplication Migration
-- Adds indexes and constraints to help prevent and detect duplicates

-- Contacts: Add unique index on email (case-insensitive, nulls allowed)
-- Using partial unique index to allow multiple nulls
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_email_unique 
ON contacts (LOWER(email)) 
WHERE email IS NOT NULL AND email != '';

-- Contacts: Add index on phone for duplicate detection
CREATE INDEX IF NOT EXISTS idx_contacts_phone 
ON contacts (phone) 
WHERE phone IS NOT NULL AND phone != '';

-- Contacts: Add composite index on name + account for duplicate detection
CREATE INDEX IF NOT EXISTS idx_contacts_name_account 
ON contacts (LOWER(first_name), LOWER(last_name), account_id);

-- Deals: Add composite unique index on name + account (if account exists)
-- This prevents exact duplicates of deals with the same name for the same account
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_name_account_unique 
ON deals (LOWER(name), account_id) 
WHERE account_id IS NOT NULL;

-- Deals: Add index on name for duplicate detection (even without account)
CREATE INDEX IF NOT EXISTS idx_deals_name 
ON deals (LOWER(name));

-- Accounts: Add unique index on name (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_name_unique 
ON accounts (LOWER(name));

-- Function to find duplicate contacts
CREATE OR REPLACE FUNCTION find_duplicate_contacts(
    p_first_name TEXT,
    p_last_name TEXT,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    account_id UUID,
    match_reason TEXT,
    similarity NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    -- Exact email match (highest priority)
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.account_id,
        'Exact email match'::TEXT as match_reason,
        1.0::NUMERIC as similarity
    FROM contacts c
    WHERE LOWER(c.email) = LOWER(p_email)
        AND p_email IS NOT NULL
        AND c.email IS NOT NULL
        AND c.email != ''
    
    UNION
    
    -- Exact phone match (high priority)
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.account_id,
        'Exact phone match'::TEXT as match_reason,
        0.9::NUMERIC as similarity
    FROM contacts c
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(c.phone, ' ', ''), '-', ''), '(', ''), ')', '') = 
          REPLACE(REPLACE(REPLACE(REPLACE(p_phone, ' ', ''), '-', ''), '(', ''), ')', '')
        AND p_phone IS NOT NULL
        AND c.phone IS NOT NULL
        AND c.phone != ''
        AND LENGTH(REPLACE(REPLACE(REPLACE(REPLACE(c.phone, ' ', ''), '-', ''), '(', ''), ')', '')) >= 10
    
    UNION
    
    -- Name + account match (moderate priority)
    SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.account_id,
        'Name and account match'::TEXT as match_reason,
        0.7::NUMERIC as similarity
    FROM contacts c
    WHERE LOWER(c.first_name) = LOWER(p_first_name)
        AND LOWER(c.last_name) = LOWER(p_last_name)
        AND (
            (p_account_id IS NOT NULL AND c.account_id = p_account_id) OR
            (p_account_id IS NULL AND c.account_id IS NULL)
        )
        AND p_first_name IS NOT NULL
        AND p_last_name IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to find duplicate deals
CREATE OR REPLACE FUNCTION find_duplicate_deals(
    p_name TEXT,
    p_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    account_id UUID,
    stage TEXT,
    amount NUMERIC,
    match_reason TEXT,
    similarity NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        d.account_id,
        d.stage,
        d.amount,
        CASE 
            WHEN p_account_id IS NOT NULL AND d.account_id = p_account_id 
            THEN 'Exact name and account match'::TEXT
            ELSE 'Exact name match'::TEXT
        END as match_reason,
        CASE 
            WHEN p_account_id IS NOT NULL AND d.account_id = p_account_id 
            THEN 0.95::NUMERIC
            ELSE 0.8::NUMERIC
        END as similarity
    FROM deals d
    WHERE LOWER(d.name) = LOWER(p_name)
        AND p_name IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

