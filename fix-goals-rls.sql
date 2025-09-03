-- Fix RLS policies for goals table to ensure service role access
-- Run this in Supabase SQL Editor

-- 1. Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'goals';

-- 2. List current RLS policies for goals table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'goals'
ORDER BY policyname;

-- 3. Drop existing goals policy that might be blocking service role
DROP POLICY IF EXISTS "goals_own_data" ON goals;

-- 4. Create new comprehensive policy that allows service role access
CREATE POLICY "goals_own_data" ON goals FOR ALL USING (
    -- Allow if user owns the data (normal case)
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    OR 
    -- Allow if service role (API calls from backend)
    auth.role() = 'service_role'
) WITH CHECK (
    -- Same checks for inserts/updates
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    OR 
    auth.role() = 'service_role'
);

-- 5. Also ensure goal_milestones and goal_reminders have proper policies
DROP POLICY IF EXISTS "goal_milestones_own_data" ON goal_milestones;
CREATE POLICY "goal_milestones_own_data" ON goal_milestones FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    OR 
    auth.role() = 'service_role'
) WITH CHECK (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    OR 
    auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "goal_reminders_own_data" ON goal_reminders;
CREATE POLICY "goal_reminders_own_data" ON goal_reminders FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    OR 
    auth.role() = 'service_role'
) WITH CHECK (
    user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
    OR 
    auth.role() = 'service_role'
);

-- 6. Grant necessary permissions to service role
GRANT ALL ON goals TO service_role;
GRANT ALL ON goal_milestones TO service_role;
GRANT ALL ON goal_reminders TO service_role;

-- 7. Ensure RLS is enabled
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_reminders ENABLE ROW LEVEL SECURITY;

-- 8. Test query to verify access
SELECT 
  id,
  name,
  category,
  target_value,
  current_value,
  status,
  user_id
FROM goals 
LIMIT 5;