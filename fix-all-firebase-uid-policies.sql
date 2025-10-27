-- Script para atualizar todas as políticas RLS que dependem de firebase_uid
-- Execute este script no painel do Supabase ou via CLI

-- =====================================
-- REMOVER POLÍTICAS ANTIGAS
-- =====================================

-- Remover políticas da tabela products
DROP POLICY IF EXISTS "products_own_data" ON products;

-- Remover políticas da tabela sales
DROP POLICY IF EXISTS "sales_own_data" ON sales;

-- Remover políticas da tabela transactions
DROP POLICY IF EXISTS "transactions_own_data" ON transactions;

-- Remover políticas da tabela debts
DROP POLICY IF EXISTS "debts_own_data" ON debts;

-- Remover políticas da tabela debt_payments
DROP POLICY IF EXISTS "debt_payments_own_data" ON debt_payments;

-- Remover políticas da tabela goal_milestones
DROP POLICY IF EXISTS "goal_milestones_own_data" ON goal_milestones;

-- Remover políticas da tabela goal_reminders
DROP POLICY IF EXISTS "goal_reminders_own_data" ON goal_reminders;

-- Remover políticas da tabela dreams
DROP POLICY IF EXISTS "dreams_own_data" ON dreams;

-- Remover políticas da tabela bets
DROP POLICY IF EXISTS "bets_own_data" ON bets;

-- Remover políticas da tabela revenues
DROP POLICY IF EXISTS "revenues_own_data" ON revenues;

-- Remover políticas da tabela expenses
DROP POLICY IF EXISTS "expenses_own_data" ON expenses;

-- Remover política da tabela users
DROP POLICY IF EXISTS "users_service_role_policy" ON users;

-- Remover políticas da tabela goals
DROP POLICY IF EXISTS "goals_own_data" ON goals;

-- Remover políticas da tabela personal_incomes
DROP POLICY IF EXISTS "Users can view own personal incomes" ON personal_incomes;

-- =====================================
-- CRIAR NOVAS POLÍTICAS SEM FIREBASE_UID
-- =====================================

-- Política para products
CREATE POLICY "products_own_data" ON products
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para sales
CREATE POLICY "sales_own_data" ON sales
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para transactions
CREATE POLICY "transactions_own_data" ON transactions
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para debts
CREATE POLICY "debts_own_data" ON debts
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para debt_payments
CREATE POLICY "debt_payments_own_data" ON debt_payments
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para goal_milestones
CREATE POLICY "goal_milestones_own_data" ON goal_milestones
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para goal_reminders
CREATE POLICY "goal_reminders_own_data" ON goal_reminders
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para dreams
CREATE POLICY "dreams_own_data" ON dreams
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para bets
CREATE POLICY "bets_own_data" ON bets
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para revenues
CREATE POLICY "revenues_own_data" ON revenues
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para expenses
CREATE POLICY "expenses_own_data" ON expenses
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para goals
CREATE POLICY "goals_own_data" ON goals
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para personal_incomes
CREATE POLICY "Users can view own personal incomes" ON personal_incomes
FOR ALL USING (
  auth.role() = 'service_role' OR 
  user_id::uuid = auth.uid()
);

-- Política para users (service role)
CREATE POLICY "users_service_role_policy" ON users
FOR ALL USING (
  auth.role() = 'service_role' OR 
  id = auth.uid()
);

-- =====================================
-- GARANTIR QUE RLS ESTÁ HABILITADO
-- =====================================

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

-- =====================================
-- COMENTÁRIOS
-- =====================================

/*
AÇÕES REALIZADAS:
- Removidas todas as políticas RLS que dependiam de firebase_uid
- Criadas novas políticas usando user_id = auth.uid() ou id = auth.uid()
- Mantido acesso total para service_role
- Habilitado RLS em todas as tabelas

TABELAS ATUALIZADAS:
- products
- sales
- transactions
- debts
- debt_payments
- goal_milestones
- goal_reminders
- dreams
- bets
- revenues
- expenses
- goals
- personal_incomes
- users

PRÓXIMO PASSO:
- Agora você pode executar: ALTER TABLE users DROP COLUMN IF EXISTS firebase_uid;
*/