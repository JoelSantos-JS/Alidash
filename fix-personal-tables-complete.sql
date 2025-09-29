-- Script completo para corrigir schema das tabelas pessoais
-- Remove views dependentes, políticas RLS, altera tipos de coluna e recria tudo

-- ========================================
-- ETAPA 1: REMOVER VIEWS DEPENDENTES
-- ========================================

-- Remover views que dependem das colunas user_id das tabelas pessoais
-- Primeiro, vamos identificar e remover todas as views que dependem das tabelas pessoais

-- Remover views conhecidas
DROP VIEW IF EXISTS personal_monthly_expenses_summary CASCADE;
DROP VIEW IF EXISTS personal_monthly_incomes_summary CASCADE;
DROP VIEW IF EXISTS personal_budget_summary CASCADE;
DROP VIEW IF EXISTS personal_budget_vs_actual CASCADE;
DROP VIEW IF EXISTS personal_goals_summary CASCADE;
DROP VIEW IF EXISTS personal_financial_summary CASCADE;
DROP VIEW IF EXISTS personal_expense_categories_summary CASCADE;
DROP VIEW IF EXISTS personal_income_categories_summary CASCADE;
DROP VIEW IF EXISTS personal_monthly_summary CASCADE;
DROP VIEW IF EXISTS personal_yearly_summary CASCADE;

-- Remover qualquer view adicional que possa depender das tabelas pessoais
-- (Execute este comando para ver se há outras views dependentes)
-- SELECT viewname FROM pg_views WHERE definition LIKE '%personal_%' AND schemaname = 'public';

-- ========================================
-- ETAPA 2: REMOVER CONSTRAINTS DE FOREIGN KEY
-- ========================================

-- Remover constraints de foreign key que referenciam users.id
ALTER TABLE personal_incomes DROP CONSTRAINT IF EXISTS personal_incomes_user_id_fkey;
ALTER TABLE personal_expenses DROP CONSTRAINT IF EXISTS personal_expenses_user_id_fkey;
ALTER TABLE personal_budgets DROP CONSTRAINT IF EXISTS personal_budgets_user_id_fkey;
ALTER TABLE personal_goals DROP CONSTRAINT IF EXISTS personal_goals_user_id_fkey;

-- ========================================
-- ETAPA 3: REMOVER POLÍTICAS RLS
-- ========================================

-- Remover políticas da tabela personal_incomes
DROP POLICY IF EXISTS "Users can view own personal incomes" ON personal_incomes;
DROP POLICY IF EXISTS "Users can insert own personal incomes" ON personal_incomes;
DROP POLICY IF EXISTS "Users can update own personal incomes" ON personal_incomes;
DROP POLICY IF EXISTS "Users can delete own personal incomes" ON personal_incomes;

-- Remover políticas da tabela personal_expenses
DROP POLICY IF EXISTS "Users can view own personal expenses" ON personal_expenses;
DROP POLICY IF EXISTS "Users can insert own personal expenses" ON personal_expenses;
DROP POLICY IF EXISTS "Users can update own personal expenses" ON personal_expenses;
DROP POLICY IF EXISTS "Users can delete own personal expenses" ON personal_expenses;

-- Remover políticas da tabela personal_budgets
DROP POLICY IF EXISTS "Users can view own personal budgets" ON personal_budgets;
DROP POLICY IF EXISTS "Users can insert own personal budgets" ON personal_budgets;
DROP POLICY IF EXISTS "Users can update own personal budgets" ON personal_budgets;
DROP POLICY IF EXISTS "Users can delete own personal budgets" ON personal_budgets;

-- Remover políticas da tabela personal_goals
DROP POLICY IF EXISTS "Users can view own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can insert own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can update own personal goals" ON personal_goals;
DROP POLICY IF EXISTS "Users can delete own personal goals" ON personal_goals;

-- ========================================
-- ETAPA 4: ALTERAR TIPOS DE COLUNA
-- ========================================

-- Alterar user_id para TEXT em todas as tabelas pessoais
ALTER TABLE personal_incomes ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE personal_expenses ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE personal_budgets ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE personal_goals ALTER COLUMN user_id TYPE TEXT;

-- ========================================
-- ETAPA 5: RECRIAR ÍNDICES
-- ========================================

-- Recriar índices para melhor performance
DROP INDEX IF EXISTS idx_personal_incomes_user_id;
CREATE INDEX idx_personal_incomes_user_id ON personal_incomes(user_id);

DROP INDEX IF EXISTS idx_personal_expenses_user_id;
CREATE INDEX idx_personal_expenses_user_id ON personal_expenses(user_id);

DROP INDEX IF EXISTS idx_personal_budgets_user_id;
CREATE INDEX idx_personal_budgets_user_id ON personal_budgets(user_id);

DROP INDEX IF EXISTS idx_personal_goals_user_id;
CREATE INDEX idx_personal_goals_user_id ON personal_goals(user_id);

-- ========================================
-- ETAPA 6: RECRIAR POLÍTICAS RLS
-- ========================================

-- Políticas para personal_incomes
CREATE POLICY "Users can view own personal incomes" ON personal_incomes
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert own personal incomes" ON personal_incomes
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own personal incomes" ON personal_incomes
    FOR UPDATE USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete own personal incomes" ON personal_incomes
    FOR DELETE USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

-- Políticas para personal_expenses
CREATE POLICY "Users can view own personal expenses" ON personal_expenses
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert own personal expenses" ON personal_expenses
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own personal expenses" ON personal_expenses
    FOR UPDATE USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete own personal expenses" ON personal_expenses
    FOR DELETE USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

-- Políticas para personal_budgets
CREATE POLICY "Users can view own personal budgets" ON personal_budgets
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert own personal budgets" ON personal_budgets
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own personal budgets" ON personal_budgets
    FOR UPDATE USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete own personal budgets" ON personal_budgets
    FOR DELETE USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

-- Políticas para personal_goals
CREATE POLICY "Users can view own personal goals" ON personal_goals
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert own personal goals" ON personal_goals
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own personal goals" ON personal_goals
    FOR UPDATE USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete own personal goals" ON personal_goals
    FOR DELETE USING (
        user_id = auth.uid()::text OR 
        user_id = (SELECT firebase_uid FROM users WHERE id = auth.uid())
    );

-- ========================================
-- ETAPA 7: RECRIAR VIEWS (SE NECESSÁRIO)
-- ========================================

-- Recriar a view personal_monthly_expenses_summary se ela existia
-- Nota: Esta view precisa ser recriada manualmente conforme a estrutura original
-- CREATE VIEW personal_monthly_expenses_summary AS ...

-- ========================================
-- ETAPA 8: VERIFICAR ALTERAÇÕES
-- ========================================

-- Verificar se as alterações foram aplicadas
SELECT 
    table_name, 
    column_name, 
    data_type 
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