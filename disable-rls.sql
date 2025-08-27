-- Script temporário para desabilitar RLS na tabela revenues
-- Execute este script no Supabase SQL Editor para testar

-- Desabilitar RLS temporariamente
ALTER TABLE revenues DISABLE ROW LEVEL SECURITY;

-- Ou criar uma política mais permissiva temporariamente
-- DROP POLICY IF EXISTS revenues_own_data ON revenues;
-- CREATE POLICY revenues_temp_policy ON revenues FOR ALL USING (true);

-- Para reabilitar depois:
-- ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS revenues_temp_policy ON revenues;
-- CREATE POLICY revenues_own_data ON revenues FOR ALL USING (
--     user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
-- );