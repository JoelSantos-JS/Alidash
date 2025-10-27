-- Adicionar coluna transaction_id à tabela revenues
ALTER TABLE revenues 
ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- Adicionar coluna transaction_id à tabela expenses
ALTER TABLE expenses 
ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_revenues_transaction_id ON revenues(transaction_id);
CREATE INDEX IF NOT EXISTS idx_expenses_transaction_id ON expenses(transaction_id);

-- Comentários para documentação
COMMENT ON COLUMN revenues.transaction_id IS 'Referência à transação que gerou esta receita';
COMMENT ON COLUMN expenses.transaction_id IS 'Referência à transação que gerou esta despesa';