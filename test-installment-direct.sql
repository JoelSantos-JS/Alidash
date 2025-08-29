-- Teste direto no Supabase SQL Editor
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as colunas existem
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name IN ('is_installment', 'installment_info')
ORDER BY column_name;

-- 2. Verificar todas as transações com campos de parcelamento
SELECT 
  id,
  description,
  amount,
  type,
  is_installment,
  installment_info,
  CASE 
    WHEN is_installment = true THEN 'SIM'
    WHEN is_installment = false THEN 'NÃO'
    ELSE 'NULL'
  END as is_installment_status,
  CASE 
    WHEN installment_info IS NOT NULL THEN 'TEM DADOS'
    ELSE 'NULL'
  END as installment_info_status
FROM transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Contar transações por status de parcelamento
SELECT 
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN is_installment = true THEN 1 END) as installment_transactions,
  COUNT(CASE WHEN is_installment = true AND installment_info IS NOT NULL THEN 1 END) as valid_installment_transactions,
  COUNT(CASE WHEN is_installment = true AND installment_info IS NULL THEN 1 END) as installment_without_info
FROM transactions;

-- 4. Verificar transações específicas com descrição que contém "parcel"
SELECT 
  id,
  description,
  amount,
  is_installment,
  installment_info,
  created_at
FROM transactions 
WHERE description ILIKE '%parcel%' 
   OR description ILIKE '%600%'
   OR description ILIKE '%12x%'
ORDER BY created_at DESC; 