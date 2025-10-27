-- Script para verificar os tipos de dados das colunas user_id
-- Execute este script primeiro para entender os tipos de dados

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE column_name IN ('user_id', 'id', 'firebase_uid')
    AND table_schema = 'public'
ORDER BY table_name, column_name;

-- Verificar especificamente as tabelas que estão causando problemas
SELECT 
    'products' as table_name,
    pg_typeof(user_id) as user_id_type
FROM products 
LIMIT 1;

SELECT 
    'sales' as table_name,
    pg_typeof(user_id) as user_id_type
FROM sales 
LIMIT 1;

SELECT 
    'transactions' as table_name,
    pg_typeof(user_id) as user_id_type
FROM transactions 
LIMIT 1;

-- Verificar o tipo de auth.uid()
SELECT pg_typeof(auth.uid()) as auth_uid_type;