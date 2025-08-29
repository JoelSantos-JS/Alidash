-- 🚨 URGENT FIX: Supabase RLS blocking installment_info JSONB field
-- Run this IMMEDIATELY in Supabase SQL Editor

-- 1. Drop ALL existing policies on transactions table
DROP POLICY IF EXISTS "Users can access their own transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can access all transactions" ON transactions;
DROP POLICY IF EXISTS "Enable read access for users and service role" ON transactions;
DROP POLICY IF EXISTS "Enable insert for users and service role" ON transactions;
DROP POLICY IF EXISTS "Enable update for users and service role" ON transactions;
DROP POLICY IF EXISTS "Enable delete for users and service role" ON transactions;

-- 2. Temporarily disable RLS to test
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 3. Test the query directly (should now return installment_info)
SELECT 
  id,
  description,
  is_installment,
  installment_info,
  installment_info::text as info_text,
  jsonb_typeof(installment_info) as jsonb_type
FROM transactions 
WHERE id = '51e7f92a-59f1-437b-a3af-3c25fdf32c29';

-- 4. If the above works, re-enable RLS with proper policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. Create a comprehensive policy that allows service_role full access
CREATE POLICY "Allow service role and user access to transactions"
ON transactions
FOR ALL
USING (
  -- Allow if it's the service role (API calls)
  auth.role() = 'service_role'
  OR 
  -- Allow if it's the user's own data
  auth.uid()::text = user_id::text
)
WITH CHECK (
  -- Same conditions for INSERT/UPDATE
  auth.role() = 'service_role'
  OR 
  auth.uid()::text = user_id::text
);

-- 6. Grant explicit permissions to service_role
GRANT ALL ON transactions TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- 7. Test again after RLS re-enabled
SELECT 
  id,
  description,
  is_installment,
  installment_info,
  installment_info ->> 'totalAmount' as total_amount,
  user_id
FROM transactions 
WHERE id = '51e7f92a-59f1-437b-a3af-3c25fdf32c29';

-- 8. Verify all installment transactions
SELECT 
  id,
  description,
  is_installment,
  CASE 
    WHEN installment_info IS NULL THEN 'NULL (PROBLEM)'
    WHEN installment_info::text = 'null' THEN 'JSON NULL'
    ELSE 'HAS DATA (GOOD)'
  END as status,
  installment_info::text
FROM transactions 
WHERE is_installment = true;

-- ✅ After running this, refresh your app and check console logs
-- You should see installment_info with actual data instead of null