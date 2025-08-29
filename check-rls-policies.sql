-- Check RLS policies for transactions table
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled on transactions table
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS Enabled'
    ELSE 'RLS Disabled'
  END AS rls_status
FROM pg_tables 
WHERE tablename = 'transactions';

-- 2. List all RLS policies for transactions table
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
WHERE tablename = 'transactions'
ORDER BY policyname;

-- 3. Check table structure for installment fields
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('is_installment', 'installment_info')
ORDER BY ordinal_position;

-- 4. Test direct query for the specific transaction
SELECT 
  id,
  description,
  is_installment,
  installment_info,
  installment_info::text as installment_info_text,
  length(installment_info::text) as info_length,
  user_id
FROM transactions 
WHERE id = '51e7f92a-59f1-437b-a3af-3c25fdf32c29';

-- 5. Check all installment transactions
SELECT 
  id,
  description,
  is_installment,
  installment_info IS NOT NULL as has_info,
  length(installment_info::text) as info_length,
  user_id,
  created_at
FROM transactions 
WHERE is_installment = true
ORDER BY created_at DESC;

-- 6. Test JSONB operations
SELECT 
  id,
  description,
  installment_info,
  installment_info -> 'totalAmount' as total_amount,
  installment_info ->> 'totalAmount' as total_amount_text,
  jsonb_typeof(installment_info) as jsonb_type
FROM transactions 
WHERE is_installment = true
LIMIT 5;