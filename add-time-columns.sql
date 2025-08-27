-- Script para adicionar colunas de hora às tabelas de receitas e despesas
-- Execute este script no seu banco Supabase

-- Adicionar coluna de hora à tabela revenues
ALTER TABLE revenues 
ADD COLUMN IF NOT EXISTS time TIME;

-- Adicionar coluna de hora à tabela expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS time TIME;

-- Verificar se as colunas foram adicionadas
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('revenues', 'expenses') 
    AND column_name = 'time'
ORDER BY table_name; 