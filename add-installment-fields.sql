-- =====================================
-- ADICIONAR CAMPOS DE PARCELAMENTO À TABELA TRANSACTIONS
-- =====================================

-- Adicionar campos para compras parceladas
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS installment_info JSONB;

-- Adicionar comentários para documentação
COMMENT ON COLUMN transactions.is_installment IS 'Indica se a transação é uma compra parcelada';
COMMENT ON COLUMN transactions.installment_info IS 'Informações detalhadas do parcelamento (JSON)';

-- Criar índice para melhorar performance de consultas por parcelamento
CREATE INDEX IF NOT EXISTS idx_transactions_is_installment ON transactions(is_installment);
CREATE INDEX IF NOT EXISTS idx_transactions_installment_info ON transactions USING GIN(installment_info);

-- Verificar se os campos foram adicionados
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('is_installment', 'installment_info')
ORDER BY column_name;

-- Exemplo de estrutura do JSON installment_info:
/*
{
  "totalAmount": 1200.00,
  "totalInstallments": 12,
  "currentInstallment": 3,
  "installmentAmount": 100.00,
  "remainingAmount": 900.00,
  "nextDueDate": "2024-02-15T00:00:00Z"
}
*/ 