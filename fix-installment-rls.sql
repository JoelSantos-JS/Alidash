-- Fix RLS policies for transactions table to ensure installment_info is accessible
-- Run this in Supabase SQL Editor

-- 1. First, let's check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'transactions';

-- 2. Ensure the transactions table has proper RLS policies for service role
-- Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "Users can access their own transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can access all transactions" ON transactions;

-- 3. Create comprehensive RLS policy for user data isolation
CREATE POLICY "Users can access their own transactions" 
ON transactions 
FOR ALL 
USING (
  auth.uid()::text = user_id::text 
  OR 
  auth.role() = 'service_role'
)
WITH CHECK (
  auth.uid()::text = user_id::text 
  OR 
  auth.role() = 'service_role'
);

-- 4. Alternative: If the above doesn't work, create separate policies
-- SELECT policy for reading data
CREATE POLICY "Enable read access for users and service role" 
ON transactions 
FOR SELECT 
USING (
  auth.uid()::text = user_id::text 
  OR 
  auth.role() = 'service_role'
);

-- INSERT policy for creating data  
CREATE POLICY "Enable insert for users and service role" 
ON transactions 
FOR INSERT 
WITH CHECK (
  auth.uid()::text = user_id::text 
  OR 
  auth.role() = 'service_role'
);

-- UPDATE policy for modifying data
CREATE POLICY "Enable update for users and service role" 
ON transactions 
FOR UPDATE 
USING (
  auth.uid()::text = user_id::text 
  OR 
  auth.role() = 'service_role'
)
WITH CHECK (
  auth.uid()::text = user_id::text 
  OR 
  auth.role() = 'service_role'
);

-- DELETE policy for removing data
CREATE POLICY "Enable delete for users and service role" 
ON transactions 
FOR DELETE 
USING (
  auth.uid()::text = user_id::text 
  OR 
  auth.role() = 'service_role'
);

-- 5. Ensure RLS is enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions to service role
GRANT ALL ON transactions TO service_role;

-- 7. Test the installment_info field access
-- This should return the actual JSONB data
SELECT 
  id,
  description,
  is_installment,
  installment_info,
  installment_info::text as installment_info_text,
  jsonb_typeof(installment_info) as jsonb_type,
  installment_info -> 'totalAmount' as total_amount,
  user_id
FROM transactions 
WHERE id = '51e7f92a-59f1-437b-a3af-3c25fdf32c29';

-- 8. Check if there are any NULL values that shouldn't be NULL
SELECT 
  id,
  description, 
  is_installment,
  CASE 
    WHEN installment_info IS NULL THEN 'NULL'
    WHEN installment_info::text = 'null' THEN 'JSON NULL'
    WHEN installment_info::text = '{}' THEN 'EMPTY OBJECT'
    ELSE 'HAS DATA'
  END as installment_info_status,
  length(installment_info::text) as info_length
FROM transactions 
WHERE is_installment = true;