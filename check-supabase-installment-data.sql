-- =====================================
-- VERIFICAR DADOS DE PARCELAMENTO NO SUPABASE
-- =====================================

-- 1. Verificar todas as transações com descrição que contém "parcel"
SELECT 
    id,
    description,
    amount,
    is_installment,
    installment_info,
    created_at
FROM transactions 
WHERE description ILIKE '%parcel%' 
   OR description ILIKE '%12x%'
   OR description ILIKE '%600%'
ORDER BY created_at DESC;

-- 2. Verificar transações com is_installment = true
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

-- 3. Verificar transações com installment_info não nulo
SELECT 
    id,
    description,
    amount,
    is_installment,
    installment_info,
    created_at
FROM transactions 
WHERE installment_info IS NOT NULL
ORDER BY created_at DESC;

-- 4. Verificar transações com is_installment = true mas installment_info nulo
SELECT 
    id,
    description,
    amount,
    is_installment,
    installment_info,
    created_at
FROM transactions 
WHERE is_installment = true AND installment_info IS NULL
ORDER BY created_at DESC;

-- 5. Verificar transações com installment_info não nulo mas is_installment = false
SELECT 
    id,
    description,
    amount,
    is_installment,
    installment_info,
    created_at
FROM transactions 
WHERE is_installment = false AND installment_info IS NOT NULL
ORDER BY created_at DESC;

-- 6. Verificar a transação específica pelo ID (se conhecido)
-- Substitua 'ID_DA_TRANSACAO' pelo ID real da transação
-- SELECT 
--     id,
--     description,
--     amount,
--     is_installment,
--     installment_info,
--     created_at
-- FROM transactions 
-- WHERE id = 'ID_DA_TRANSACAO';

-- 7. Contar transações por status de parcelamento
SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN is_installment = true THEN 1 END) as parceladas_true,
    COUNT(CASE WHEN is_installment = false THEN 1 END) as parceladas_false,
    COUNT(CASE WHEN is_installment IS NULL THEN 1 END) as parceladas_null,
    COUNT(CASE WHEN installment_info IS NOT NULL THEN 1 END) as com_installment_info,
    COUNT(CASE WHEN installment_info IS NULL THEN 1 END) as sem_installment_info
FROM transactions;

-- 8. Verificar transações mais recentes
SELECT 
    id,
    description,
    amount,
    is_installment,
    installment_info,
    created_at
FROM transactions 
ORDER BY created_at DESC 
LIMIT 10; 