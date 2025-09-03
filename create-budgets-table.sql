-- Criar tabela budgets no Supabase
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    monthly_budget DECIMAL(10,2) NOT NULL DEFAULT 400.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para que usuários só vejam seus próprios orçamentos
CREATE POLICY "Users can view own budgets" ON public.budgets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own budgets" ON public.budgets
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budgets" ON public.budgets
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own budgets" ON public.budgets
    FOR DELETE USING (user_id = auth.uid());

-- Comentários para documentação
COMMENT ON TABLE public.budgets IS 'Tabela para armazenar orçamentos mensais dos usuários';
COMMENT ON COLUMN public.budgets.user_id IS 'Referência ao usuário dono do orçamento';
COMMENT ON COLUMN public.budgets.monthly_budget IS 'Valor do orçamento mensal em reais';
COMMENT ON COLUMN public.budgets.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.budgets.updated_at IS 'Data da última atualização do registro';