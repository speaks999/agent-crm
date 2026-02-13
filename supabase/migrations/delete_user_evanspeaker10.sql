-- ============================================
-- Script to Delete User: evanspeaker10@gmail.com
-- This will delete the user and ALL related data
-- ============================================

-- First, let's see what will be deleted (run this first to review)
DO $$
DECLARE
    v_user_id UUID;
    v_team_count INTEGER;
    v_membership_count INTEGER;
    v_invite_count INTEGER;
    v_pref_count INTEGER;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'evanspeaker10@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User evanspeaker10@gmail.com not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user: % (ID: %)', 'evanspeaker10@gmail.com', v_user_id;
    RAISE NOTICE '---------------------------------------------------';
    
    -- Count teams owned by this user (will be CASCADE deleted with all their data)
    SELECT COUNT(*) INTO v_team_count FROM teams WHERE owner_id = v_user_id;
    RAISE NOTICE 'Teams owned by user (will be deleted with ALL team data): %', v_team_count;
    
    IF v_team_count > 0 THEN
        RAISE NOTICE 'Team IDs that will be deleted:';
        FOR rec IN (SELECT id, name FROM teams WHERE owner_id = v_user_id) LOOP
            RAISE NOTICE '  - % (%)', rec.name, rec.id;
        END LOOP;
    END IF;
    
    -- Count team memberships
    SELECT COUNT(*) INTO v_membership_count FROM team_memberships WHERE user_id = v_user_id;
    RAISE NOTICE 'Team memberships: %', v_membership_count;
    
    -- Count invites sent by user
    SELECT COUNT(*) INTO v_invite_count FROM team_invites WHERE invited_by = v_user_id;
    RAISE NOTICE 'Team invites sent: %', v_invite_count;
    
    -- Count preferences
    SELECT COUNT(*) INTO v_pref_count FROM user_preferences WHERE user_id = v_user_id;
    RAISE NOTICE 'User preferences records: %', v_pref_count;
    
    SELECT COUNT(*) INTO v_pref_count FROM user_team_preferences WHERE user_id = v_user_id;
    RAISE NOTICE 'User team preferences records: %', v_pref_count;
    
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'NOTE: Deleting teams will CASCADE delete:';
    RAISE NOTICE '  - All accounts in those teams';
    RAISE NOTICE '  - All contacts in those teams';
    RAISE NOTICE '  - All deals in those teams';
    RAISE NOTICE '  - All interactions in those teams';
    RAISE NOTICE '  - All pipelines in those teams';
    RAISE NOTICE '  - All tags in those teams';
    RAISE NOTICE '  - All team members in those teams';
    RAISE NOTICE '---------------------------------------------------';
END $$;

-- ============================================
-- ACTUAL DELETION (Uncomment to execute)
-- ============================================
-- WARNING: This is irreversible!
-- Uncomment the lines below after reviewing the counts above

/*
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'evanspeaker10@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User evanspeaker10@gmail.com not found - nothing to delete';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Starting deletion of user: evanspeaker10@gmail.com';
    RAISE NOTICE 'User ID: %', v_user_id;
    
    -- Delete the user from auth.users
    -- This will CASCADE delete:
    --   - user_preferences
    --   - user_team_preferences
    --   - teams (and all related team data)
    --   - team_memberships
    --   - team_invites
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'User and all related data successfully deleted';
END $$;
*/
