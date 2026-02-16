-- Run this in Supabase SQL Editor to check team setup

-- 1. Check current user (replace with your actual email)
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'evanspeaker10@gmail.com';

-- 2. Check user's team preferences
SELECT utp.*, t.name as team_name
FROM user_team_preferences utp
LEFT JOIN teams t ON t.id = utp.current_team_id
WHERE utp.user_id IN (SELECT id FROM auth.users WHERE email = 'evanspeaker10@gmail.com');

-- 3. Check user's team memberships
SELECT tm.*, t.name as team_name
FROM team_memberships tm
LEFT JOIN teams t ON t.id = tm.team_id
WHERE tm.user_id IN (SELECT id FROM auth.users WHERE email = 'evanspeaker10@gmail.com');

-- 4. Check team_members table
SELECT * FROM team_members
WHERE email = 'evanspeaker10@gmail.com'
ORDER BY created_at DESC;

-- 5. Check all teams owned by user
SELECT * FROM teams
WHERE owner_id IN (SELECT id FROM auth.users WHERE email = 'evanspeaker10@gmail.com');

-- 6. For the user's current team, show all team_members
SELECT tm.*
FROM team_members tm
WHERE tm.team_id IN (
    SELECT current_team_id 
    FROM user_team_preferences 
    WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'evanspeaker10@gmail.com')
)
ORDER BY tm.created_at DESC;
