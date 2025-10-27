-- Criar tabela para tokens de catálogo público
-- Esta tabela permite que usuários compartilhem seus produtos publicamente

CREATE TABLE IF NOT EXISTS public.catalog_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token VARCHAR(32) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_catalog_tokens_user_id ON public.catalog_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_tokens_token ON public.catalog_tokens(token);
CREATE INDEX IF NOT EXISTS idx_catalog_tokens_active ON public.catalog_tokens(is_active);

-- RLS (Row Level Security)
ALTER TABLE public.catalog_tokens ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seus próprios tokens
CREATE POLICY "Users can view own catalog tokens" ON public.catalog_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários só podem inserir seus próprios tokens
CREATE POLICY "Users can insert own catalog tokens" ON public.catalog_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem atualizar seus próprios tokens
CREATE POLICY "Users can update own catalog tokens" ON public.catalog_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários só podem deletar seus próprios tokens
CREATE POLICY "Users can delete own catalog tokens" ON public.catalog_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Adicionar campo is_public na tabela products (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'is_public') THEN
        ALTER TABLE public.products ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Comentários para documentação
COMMENT ON TABLE public.catalog_tokens IS 'Tokens únicos para compartilhamento público de catálogos de produtos';
COMMENT ON COLUMN public.catalog_tokens.token IS 'Token único de 32 caracteres para acesso público';