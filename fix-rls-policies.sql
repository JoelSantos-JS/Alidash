-- Fix RLS Policies for Service Role Operations
-- This script updates RLS policies to allow service role operations while maintaining security

-- =====================================
-- USERS TABLE RLS FIX
-- =====================================

-- Drop existing users policy
DROP POLICY IF EXISTS users_own_data ON users;

-- Create new policy that allows service role to insert/update users
-- but still restricts regular users to their own data
CREATE POLICY users_service_role_policy ON users FOR ALL 
USING (
    auth.role() = 'service_role' OR 
    auth.uid()::text = firebase_uid
);

-- Alternative: Create separate policies for different operations
-- DROP POLICY IF EXISTS users_service_role_policy ON users;

-- -- Allow service role to insert users
-- CREATE POLICY users_insert_policy ON users FOR INSERT
-- WITH CHECK (auth.role() = 'service_role');

-- -- Allow users to read/update their own data
-- CREATE POLICY users_select_policy ON users FOR SELECT
-- USING (auth.uid()::text = firebase_uid);

-- CREATE POLICY users_update_policy ON users FOR UPDATE
-- USING (auth.uid()::text = firebase_uid);

-- =====================================
-- OPTIONAL: SIMILAR FIXES FOR OTHER TABLES
-- =====================================

-- Uncomment if you want to allow service role operations on other tables

-- -- Products table
-- DROP POLICY IF EXISTS products_own_data ON products;
-- CREATE POLICY products_service_role_policy ON products FOR ALL 
-- USING (
--     auth.role() = 'service_role' OR 
--     user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
-- );

-- -- Revenues table  
-- DROP POLICY IF EXISTS revenues_own_data ON revenues;
-- CREATE POLICY revenues_service_role_policy ON revenues FOR ALL 
-- USING (
--     auth.role() = 'service_role' OR 
--     user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
-- );

-- -- Transactions table
-- DROP POLICY IF EXISTS transactions_own_data ON transactions;
-- CREATE POLICY transactions_service_role_policy ON transactions FOR ALL 
-- USING (
--     auth.role() = 'service_role' OR 
--     user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
-- );

-- =====================================
-- VERIFICATION QUERIES
-- =====================================

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- Test user creation (service role should be able to create users)
-- This query should work when executed with service role
-- INSERT INTO users (firebase_uid, email, name) 
-- VALUES ('test-uid', 'test@example.com', 'Test User') 
-- RETURNING *;