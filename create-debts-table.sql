-- Criar tabela debts no Supabase
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    creditor_name VARCHAR(255) NOT NULL,
    description TEXT,
    original_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) NOT NULL,
    interest_rate DECIMAL(5,2),
    due_date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    notes TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    installments JSONB,
    payments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON public.debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_category ON public.debts(category);
CREATE INDEX IF NOT EXISTS idx_debts_priority ON public.debts(priority);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para que usuários só vejam suas próprias dívidas
CREATE POLICY "Users can view own debts" ON public.debts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own debts" ON public.debts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own debts" ON public.debts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own debts" ON public.debts
    FOR DELETE USING (user_id = auth.uid());

-- Comentários para documentação
COMMENT ON TABLE public.debts IS 'Tabela para armazenar dívidas dos usuários';
COMMENT ON COLUMN public.debts.user_id IS 'Referência ao usuário dono da dívida';
COMMENT ON COLUMN public.debts.creditor_name IS 'Nome do credor';
COMMENT ON COLUMN public.debts.description IS 'Descrição da dívida';
COMMENT ON COLUMN public.debts.original_amount IS 'Valor original da dívida';
COMMENT ON COLUMN public.debts.current_amount IS 'Valor atual da dívida';
COMMENT ON COLUMN public.debts.interest_rate IS 'Taxa de juros (percentual)';
COMMENT ON COLUMN public.debts.due_date IS 'Data de vencimento';
COMMENT ON COLUMN public.debts.category IS 'Categoria da dívida (credit_card, loan, supplier, personal, etc.)';
COMMENT ON COLUMN public.debts.priority IS 'Prioridade (urgent, high, medium, low)';
COMMENT ON COLUMN public.debts.status IS 'Status (pending, paid, overdue, partial)';
COMMENT ON COLUMN public.debts.payment_method IS 'Método de pagamento preferido';
COMMENT ON COLUMN public.debts.notes IS 'Observações adicionais';
COMMENT ON COLUMN public.debts.tags IS 'Tags em formato JSON';
COMMENT ON COLUMN public.debts.installments IS 'Informações de parcelamento em formato JSON';
COMMENT ON COLUMN public.debts.payments IS 'Histórico de pagamentos em formato JSON';
COMMENT ON COLUMN public.debts.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.debts.updated_at IS 'Data da última atualização do registro';