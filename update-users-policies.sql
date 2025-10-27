-- Script para atualizar políticas RLS da tabela users
-- Remove todas as referências ao firebase_uid e usa apenas o id do usuário

-- =====================================
-- REMOVER POLÍTICAS EXISTENTES
-- =====================================

-- Remover todas as políticas existentes da tabela users
DROP POLICY IF EXISTS users_own_data ON users;
DROP POLICY IF EXISTS users_comprehensive_policy ON users;
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;
DROP POLICY IF EXISTS users_service_role_policy ON users;

-- =====================================
-- CRIAR NOVAS POLÍTICAS SEM FIREBASE_UID
-- =====================================

-- Política para SELECT: usuários podem ver seus próprios dados
CREATE POLICY users_select_policy ON users FOR SELECT 
USING (
    -- Service role tem acesso total
    auth.role() = 'service_role' 
    OR 
    -- Usuários podem ver seus próprios dados usando o ID
    auth.uid()::text = id::text
);

-- Política para INSERT: permitir criação de usuários
CREATE POLICY users_insert_policy ON users FOR INSERT 
WITH CHECK (
    -- Service role pode inserir qualquer usuário
    auth.role() = 'service_role' 
    OR 
    -- Usuários autenticados podem inserir seus próprios dados
    (auth.uid() IS NOT NULL AND auth.uid()::text = id::text)
);

-- Política para UPDATE: usuários podem atualizar seus próprios dados
CREATE POLICY users_update_policy ON users FOR UPDATE 
USING (
    -- Service role tem acesso total
    auth.role() = 'service_role' 
    OR 
    -- Usuários podem atualizar seus próprios dados
    auth.uid()::text = id::text
)
WITH CHECK (
    -- Service role pode atualizar qualquer usuário
    auth.role() = 'service_role' 
    OR 
    -- Usuários só podem atualizar seus próprios dados
    auth.uid()::text = id::text
);

-- Política para DELETE: usuários podem deletar seus próprios dados
CREATE POLICY users_delete_policy ON users FOR DELETE 
USING (
    -- Service role tem acesso total
    auth.role() = 'service_role' 
    OR 
    -- Usuários podem deletar seus próprios dados
    auth.uid()::text = id::text
);

-- =====================================
-- VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================

-- Garantir que RLS está habilitado na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================
-- COMENTÁRIOS SOBRE AS MUDANÇAS
-- =====================================

/*
MUDANÇAS REALIZADAS:

1. REMOVIDAS todas as políticas que faziam referência ao firebase_uid
2. CRIADAS novas políticas que usam apenas o campo 'id' da tabela users
3. MANTIDO acesso total para service_role (necessário para operações do backend)
4. SIMPLIFICADAS as condições das políticas para melhor performance

POLÍTICAS CRIADAS:
- users_select_policy: Permite leitura dos próprios dados
- users_insert_policy: Permite criação de usuários autenticados
- users_update_policy: Permite atualização dos próprios dados
- users_delete_policy: Permite exclusão dos próprios dados

IMPORTANTE:
- Todas as políticas agora usam auth.uid()::text = id::text
- Service role mantém acesso total para operações administrativas
- Não há mais dependência do campo firebase_uid
*/