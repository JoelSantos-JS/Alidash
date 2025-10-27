-- Script para remover fisicamente a coluna firebase_uid da tabela users
-- Execute este script no painel do Supabase ou via CLI

-- =====================================
-- REMOVER COLUNA FIREBASE_UID
-- =====================================

-- Remover a coluna firebase_uid da tabela users
ALTER TABLE users DROP COLUMN IF EXISTS firebase_uid;

-- =====================================
-- VERIFICAR SE A COLUNA FOI REMOVIDA
-- =====================================

-- Esta query pode ser executada para verificar se a coluna foi removida
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'public';

-- =====================================
-- COMENTÁRIOS
-- =====================================

/*
AÇÃO REALIZADA:
- Removida fisicamente a coluna firebase_uid da tabela users

IMPORTANTE:
- Esta ação é irreversível
- Certifique-se de que nenhuma aplicação está usando esta coluna
- As políticas RLS já foram atualizadas para não usar firebase_uid
- Faça backup antes de executar se necessário

PRÓXIMOS PASSOS:
- Verificar se outras tabelas ainda fazem referência ao firebase_uid
- Atualizar políticas RLS de outras tabelas se necessário
- Testar a aplicação para garantir que tudo funciona
*/