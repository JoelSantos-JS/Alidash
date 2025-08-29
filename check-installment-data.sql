-- Verificar dados de parcelamento no Supabase
-- Execute no SQL Editor do Supabase

-- 1. Verificar se as colunas existem
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name IN ('is_installment', 'installment_info');

-- 2. Verificar transações com parcelamento
SELECT 
  id,
  description,
  amount,
  is_installment,
  installment_info,
  created_at
FROM transactions 
WHERE is_installment = true
ORDER BY created_at DESC;

-- 3. Verificar transações com descrição que contém "parcel" ou "600"
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

-- 4. Contar transações por status
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_installment = true THEN 1 END) as parceladas,
  COUNT(CASE WHEN is_installment = true AND installment_info IS NOT NULL THEN 1 END) as parceladas_com_info
FROM transactions; 