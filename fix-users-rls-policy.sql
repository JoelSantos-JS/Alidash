-- Fix RLS policies for users table to allow user creation
-- This script fixes the issue where new users cannot be created due to RLS policies

-- Drop the existing policy that only checks firebase_uid
DROP POLICY IF EXISTS users_own_data ON users;

-- Create a new policy that allows:
-- 1. Service role to perform all operations (for backend operations)
-- 2. Users to access their own data using either id or firebase_uid
-- 3. Allow INSERT for authenticated users (for user creation)
CREATE POLICY users_comprehensive_policy ON users FOR ALL 
USING (
    -- Allow service role full access
    auth.role() = 'service_role' 
    OR 
    -- Allow users to access their own data by ID
    auth.uid()::text = id::text
    OR 
    -- Allow users to access their own data by firebase_uid (for legacy compatibility)
    auth.uid()::text = firebase_uid
)
WITH CHECK (
    -- Allow service role to insert/update
    auth.role() = 'service_role' 
    OR 
    -- Allow authenticated users to insert their own data
    auth.uid()::text = id::text
    OR 
    -- Allow legacy firebase_uid matching
    auth.uid()::text = firebase_uid
);

-- Alternative approach: Create separate policies for different operations
-- Uncomment the following if the above doesn't work:

/*
-- Drop the comprehensive policy
DROP POLICY IF EXISTS users_comprehensive_policy ON users;

-- Allow SELECT for users to read their own data
CREATE POLICY users_select_policy ON users FOR SELECT 
USING (
    auth.role() = 'service_role' 
    OR auth.uid()::text = id::text 
    OR auth.uid()::text = firebase_uid
);

-- Allow INSERT for authenticated users and service role
CREATE POLICY users_insert_policy ON users FOR INSERT 
WITH CHECK (
    auth.role() = 'service_role' 
    OR auth.uid() IS NOT NULL
);

-- Allow UPDATE for users to modify their own data
CREATE POLICY users_update_policy ON users FOR UPDATE 
USING (
    auth.role() = 'service_role' 
    OR auth.uid()::text = id::text 
    OR auth.uid()::text = firebase_uid
);

-- Allow DELETE for users to delete their own data
CREATE POLICY users_delete_policy ON users FOR DELETE 
USING (
    auth.role() = 'service_role' 
    OR auth.uid()::text = id::text 
    OR auth.uid()::text = firebase_uid
);
*/

-- Verify the policy was created
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
WHERE tablename = 'users'
ORDER BY policyname;