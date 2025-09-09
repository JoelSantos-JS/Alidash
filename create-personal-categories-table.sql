-- Criar tabela para categorias pessoais personalizadas
-- Esta tabela permite que usuários criem suas próprias categorias além das padrão

CREATE TABLE IF NOT EXISTS personal_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Firebase UID
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL, -- Categoria base do ENUM (salary, housing, etc.)
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT,
    is_essential BOOLEAN DEFAULT false,
    budget_limit DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_category_name UNIQUE (user_id, name),
    CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT valid_budget CHECK (budget_limit IS NULL OR budget_limit >= 0)
);

-- Índices para performance
CREATE INDEX idx_personal_categories_user_id ON personal_categories(user_id);
CREATE INDEX idx_personal_categories_type ON personal_categories(type);
CREATE INDEX idx_personal_categories_category ON personal_categories(category);
CREATE INDEX idx_personal_categories_active ON personal_categories(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE personal_categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para segurança
CREATE POLICY "Users can only see their own personal categories" ON personal_categories
    FOR SELECT USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
        OR user_id = auth.uid()::text
        OR user_id = current_user
    );

CREATE POLICY "Users can only insert their own personal categories" ON personal_categories
    FOR INSERT WITH CHECK (
        user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
        OR user_id = auth.uid()::text
        OR user_id = current_user
    );

CREATE POLICY "Users can only update their own personal categories" ON personal_categories
    FOR UPDATE USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
        OR user_id = auth.uid()::text
        OR user_id = current_user
    );

CREATE POLICY "Users can only delete their own personal categories" ON personal_categories
    FOR DELETE USING (
        user_id = current_setting('request.jwt.claims', true)::json->>'firebase_uid'
        OR user_id = auth.uid()::text
        OR user_id = current_user
    );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_personal_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personal_categories_updated_at
    BEFORE UPDATE ON personal_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_personal_categories_updated_at();

-- Comentários para documentação
COMMENT ON TABLE personal_categories IS 'Categorias personalizadas criadas pelos usuários para organizar suas finanças pessoais';
COMMENT ON COLUMN personal_categories.user_id IS 'ID do usuário (Firebase UID)';
COMMENT ON COLUMN personal_categories.name IS 'Nome personalizado da categoria';
COMMENT ON COLUMN personal_categories.type IS 'Tipo: income (receita) ou expense (despesa)';
COMMENT ON COLUMN personal_categories.category IS 'Categoria base do sistema (salary, housing, etc.)';
COMMENT ON COLUMN personal_categories.color IS 'Cor em formato hexadecimal (#RRGGBB)';
COMMENT ON COLUMN personal_categories.icon IS 'Nome do ícone (Lucide React)';
COMMENT ON COLUMN personal_categories.is_essential IS 'Se é uma despesa essencial (apenas para expenses)';
COMMENT ON COLUMN personal_categories.budget_limit IS 'Limite orçamentário mensal (apenas para expenses)';
COMMENT ON COLUMN personal_categories.is_active IS 'Se a categoria está ativa para uso';