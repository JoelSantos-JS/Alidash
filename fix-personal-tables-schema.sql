-- Script para corrigir o schema das tabelas pessoais
-- Alterando user_id de UUID para TEXT para aceitar Firebase UID

-- =====================================
-- ALTERAR TABELAS PESSOAIS
-- =====================================

-- 1. Remover constraints de foreign key
ALTER TABLE personal_incomes DROP CONSTRAINT IF EXISTS personal_incomes_user_id_fkey;
ALTER TABLE personal_expenses DROP CONSTRAINT IF EXISTS personal_expenses_user_id_fkey;
ALTER TABLE personal_budgets DROP CONSTRAINT IF EXISTS personal_budgets_user_id_fkey;
ALTER TABLE personal_goals DROP CONSTRAINT IF EXISTS personal_goals_user_id_fkey;

-- 2. Alterar tipo da coluna user_id para TEXT
ALTER TABLE personal_incomes ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE personal_expenses ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE personal_budgets ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE personal_goals ALTER COLUMN user_id TYPE TEXT;

-- 3. Recriar índices se necessário
DROP INDEX IF EXISTS idx_personal_incomes_user_id;
DROP INDEX IF EXISTS idx_personal_expenses_user_id;
DROP INDEX IF EXISTS idx_personal_budgets_user_id;
DROP INDEX IF EXISTS idx_personal_goals_user_id;

CREATE INDEX idx_personal_incomes_user_id ON personal_incomes(user_id);
CREATE INDEX idx_personal_expenses_user_id ON personal_expenses(user_id);
CREATE INDEX idx_personal_budgets_user_id ON personal_budgets(user_id);
CREATE INDEX idx_personal_goals_user_id ON personal_goals(user_id);

-- 4. Atualizar políticas RLS para usar TEXT
DROP POLICY IF EXISTS "Users can only see their own personal incomes" ON personal_incomes;
DROP POLICY IF EXISTS "Users can only insert their own personal incomes" ON personal_incomes;
DROP POLICY IF EXISTS "Users can only update their own personal incomes" ON personal_incomes;
DROP POLICY IF EXISTS "Users can only delete their own personal incomes" ON personal_incomes;

DROP POLICY IF EXISTS "Users can only see their own personal expenses" ON personal_expenses;
DROP POLICY IF EXISTS "Users can only insert their own personal expenses" ON personal_expenses;
DROP POLICY IF EXISTS "Users can only update their own personal expenses" ON personal_expenses;
DROP POLICY IF EXISTS "Users can only delete their own personal expenses" ON personal_expenses;

DROP POLICY IF EXISTS "Users can only see their own personal budgets" ON personal_budgets;
DROP POLICY IF EXISTS "Users can only insert their own personal budgets" ON personal_budgets;
DROP POLICY IF EXISTS "Users can only update their own personal budgets" ON personal_budgets;
DROP POLICY IF EXISTS "Users can only delete their own personal budgets" ON personal_budgets;

DROP POLICY IF EXISTS "Users can only see their own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can only insert their own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can only update their own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can only delete their own personal goals" ON personal_goals;

-- Recriar políticas RLS para aceitar Firebase UID (TEXT)
-- PERSONAL_INCOMES
CREATE POLICY "Users can only see their own personal incomes" ON personal_incomes
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

CREATE POLICY "Users can only insert their own personal incomes" ON personal_incomes
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                          OR user_id = auth.uid()::text
                          OR user_id = current_user);

CREATE POLICY "Users can only update their own personal incomes" ON personal_incomes
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

CREATE POLICY "Users can only delete their own personal incomes" ON personal_incomes
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

-- PERSONAL_EXPENSES
CREATE POLICY "Users can only see their own personal expenses" ON personal_expenses
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

CREATE POLICY "Users can only insert their own personal expenses" ON personal_expenses
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                          OR user_id = auth.uid()::text
                          OR user_id = current_user);

CREATE POLICY "Users can only update their own personal expenses" ON personal_expenses
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

CREATE POLICY "Users can only delete their own personal expenses" ON personal_expenses
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

-- PERSONAL_BUDGETS
CREATE POLICY "Users can only see their own personal budgets" ON personal_budgets
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

CREATE POLICY "Users can only insert their own personal budgets" ON personal_budgets
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                          OR user_id = auth.uid()::text
                          OR user_id = current_user);

CREATE POLICY "Users can only update their own personal budgets" ON personal_budgets
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

CREATE POLICY "Users can only delete their own personal budgets" ON personal_budgets
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

-- PERSONAL_GOALS
CREATE POLICY "Users can only see their own personal goals" ON personal_goals
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

CREATE POLICY "Users can only insert their own personal goals" ON personal_goals
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                          OR user_id = auth.uid()::text
                          OR user_id = current_user);

CREATE POLICY "Users can only update their own personal goals" ON personal_goals
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

CREATE POLICY "Users can only delete their own personal goals" ON personal_goals
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
                     OR user_id = auth.uid()::text
                     OR user_id = current_user);

-- =====================================
-- VERIFICAÇÃO
-- =====================================

-- Verificar estrutura das tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('personal_incomes', 'personal_expenses', 'personal_budgets', 'personal_goals')
    AND column_name = 'user_id'
ORDER BY table_name;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('personal_incomes', 'personal_expenses', 'personal_budgets', 'personal_goals')
ORDER BY tablename, policyname;