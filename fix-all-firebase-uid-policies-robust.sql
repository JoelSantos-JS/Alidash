-- Script robusto para corrigir todas as políticas RLS que dependem de firebase_uid
-- Este script trata diferentes tipos de dados (text, uuid, etc.)

-- PASSO 1: Remover todas as políticas antigas que dependem de firebase_uid
DROP POLICY IF EXISTS "products_own_data" ON products;
DROP POLICY IF EXISTS "sales_own_data" ON sales;
DROP POLICY IF EXISTS "transactions_own_data" ON transactions;
DROP POLICY IF EXISTS "debts_own_data" ON debts;
DROP POLICY IF EXISTS "debt_payments_own_data" ON debt_payments;
DROP POLICY IF EXISTS "goal_milestones_own_data" ON goal_milestones;
DROP POLICY IF EXISTS "goal_reminders_own_data" ON goal_reminders;
DROP POLICY IF EXISTS "dreams_own_data" ON dreams;
DROP POLICY IF EXISTS "bets_own_data" ON bets;
DROP POLICY IF EXISTS "revenues_own_data" ON revenues;
DROP POLICY IF EXISTS "expenses_own_data" ON expenses;
DROP POLICY IF EXISTS "goals_own_data" ON goals;
DROP POLICY IF EXISTS "Users can view own personal incomes" ON personal_incomes;
DROP POLICY IF EXISTS "users_service_role_policy" ON users;

-- PASSO 2: Criar novas políticas com conversão de tipos robusta
-- Para tabelas onde user_id pode ser text ou uuid

-- Política para products
CREATE POLICY "products_own_data" ON products
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para sales
CREATE POLICY "sales_own_data" ON sales
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para transactions
CREATE POLICY "transactions_own_data" ON transactions
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para debts
CREATE POLICY "debts_own_data" ON debts
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para debt_payments
CREATE POLICY "debt_payments_own_data" ON debt_payments
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para goal_milestones
CREATE POLICY "goal_milestones_own_data" ON goal_milestones
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para goal_reminders
CREATE POLICY "goal_reminders_own_data" ON goal_reminders
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para dreams
CREATE POLICY "dreams_own_data" ON dreams
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para bets
CREATE POLICY "bets_own_data" ON bets
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para revenues
CREATE POLICY "revenues_own_data" ON revenues
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para expenses
CREATE POLICY "expenses_own_data" ON expenses
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para goals
CREATE POLICY "goals_own_data" ON goals
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para personal_incomes
CREATE POLICY "Users can view own personal incomes" ON personal_incomes
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (user_id IS NOT NULL AND user_id::text = auth.uid()::text)
);

-- Política para users (usando id que deve ser uuid)
CREATE POLICY "users_service_role_policy" ON users
FOR ALL USING (
  auth.role() = 'service_role' OR 
  (id IS NOT NULL AND id = auth.uid())
);

-- PASSO 3: Garantir que RLS está habilitado em todas as tabelas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Tentar remover a coluna firebase_uid da tabela users
-- (Isso só funcionará se todas as dependências foram removidas)
ALTER TABLE users DROP COLUMN IF EXISTS firebase_uid;

-- Verificação final
SELECT 'Script executado com sucesso!' as status;