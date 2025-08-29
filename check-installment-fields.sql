-- =====================================
-- VERIFICAR CAMPOS DE PARCELAMENTO NA TABELA TRANSACTIONS
-- =====================================

-- 1. Verificar se a tabela transactions existe
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'transactions';

-- 2. Verificar todos os campos da tabela transactions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- 3. Verificar especificamente os campos de parcelamento
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('is_installment', 'installment_info')
ORDER BY column_name;

-- 4. Verificar se há dados na tabela
SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN is_installment = true THEN 1 END) as parceladas,
    COUNT(CASE WHEN is_installment = false OR is_installment IS NULL THEN 1 END) as nao_parceladas
FROM transactions;

-- 5. Verificar algumas transações de exemplo
SELECT 
    id,
    description,
    amount,
    is_installment,
    installment_info,
    created_at
FROM transactions 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Verificar se há transações parceladas
SELECT 
    id,
    description,
    amount,
    is_installment,
    installment_info
FROM transactions 
WHERE is_installment = true
ORDER BY created_at DESC;

-- 7. Verificar estrutura completa da tabela (se os campos não existem)
-- Esta query vai falhar se os campos não existirem, mas mostrará a estrutura atual
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position; 