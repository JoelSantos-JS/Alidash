-- Criar tabela de categorias no Supabase
-- Esta tabela armazenará as categorias personalizadas dos usuários

CREATE TYPE category_type AS ENUM ('income', 'expense', 'both');

-- =====================================
-- CATEGORIES TABLE
-- =====================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type category_type NOT NULL DEFAULT 'expense',
    color TEXT DEFAULT '#6B7280', -- Cor em hexadecimal
    icon TEXT DEFAULT 'tag', -- Nome do ícone
    budget DECIMAL(10,2) DEFAULT 0, -- Orçamento mensal para a categoria
    spent DECIMAL(10,2) DEFAULT 0, -- Valor gasto no mês atual
    transactions INTEGER DEFAULT 0, -- Número de transações
    is_default BOOLEAN DEFAULT false, -- Se é uma categoria padrão do sistema
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar categorias duplicadas por usuário
    UNIQUE(user_id, name)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver suas próprias categorias
CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

-- Política: usuários só podem inserir suas próprias categorias
CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

-- Política: usuários só podem atualizar suas próprias categorias
CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id));

-- Política: usuários só podem deletar suas próprias categorias (exceto padrões)
CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (
        auth.uid()::text = (SELECT firebase_uid FROM users WHERE id = user_id) 
        AND is_default = false
    );

-- Inserir categorias padrão do sistema
INSERT INTO categories (user_id, name, description, type, color, icon, is_default) 
SELECT 
    u.id,
    category_data.name,
    category_data.description,
    category_data.type::category_type,
    category_data.color,
    category_data.icon,
    true
FROM users u
CROSS JOIN (
    VALUES 
    ('Alimentação', 'Gastos com comida e bebidas', 'expense', '#EF4444', 'utensils'),
    ('Transporte', 'Combustível, transporte público, manutenção', 'expense', '#F97316', 'car'),
    ('Moradia', 'Aluguel, condomínio, IPTU, manutenção', 'expense', '#8B5CF6', 'home'),
    ('Saúde', 'Planos de saúde, medicamentos, consultas', 'expense', '#10B981', 'heart'),
    ('Educação', 'Cursos, livros, material escolar', 'expense', '#3B82F6', 'book-open'),
    ('Lazer', 'Entretenimento, viagens, hobbies', 'expense', '#F59E0B', 'smile'),
    ('Roupas', 'Vestuário e acessórios', 'expense', '#EC4899', 'shirt'),
    ('Tecnologia', 'Eletrônicos, software, internet', 'expense', '#6366F1', 'smartphone'),
    ('Vendas', 'Receita de vendas de produtos', 'income', '#22C55E', 'shopping-cart'),
    ('Freelance', 'Trabalhos autônomos', 'income', '#06B6D4', 'briefcase'),
    ('Investimentos', 'Dividendos, juros, ganhos', 'income', '#8B5CF6', 'trending-up'),
    ('Outros', 'Outras receitas', 'income', '#6B7280', 'plus-circle')
) AS category_data(name, description, type, color, icon)
WHERE NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.user_id = u.id AND c.name = category_data.name
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at_trigger
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();