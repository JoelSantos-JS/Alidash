-- Add installment fields to expenses table
-- This fixes the error: ❌ Erro ao inserir despesa: {}

-- Add is_installment column to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT FALSE;

-- Add installment_info column to expenses table  
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS installment_info JSONB;

-- Create index for better performance on installment queries
CREATE INDEX IF NOT EXISTS idx_expenses_is_installment ON expenses(is_installment);

-- Add comments for documentation
COMMENT ON COLUMN expenses.is_installment IS 'Indica se a despesa é parcelada';
COMMENT ON COLUMN expenses.installment_info IS 'Informações sobre o parcelamento da despesa (JSONB)';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name IN ('is_installment', 'installment_info')
ORDER BY column_name;