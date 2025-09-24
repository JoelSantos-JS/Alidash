-- Criar tabela para configurações de salário fixo
CREATE TABLE IF NOT EXISTS personal_salary_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    payment_day INTEGER NOT NULL CHECK (payment_day >= 1 AND payment_day <= 31),
    is_active BOOLEAN DEFAULT true,
    is_taxable BOOLEAN DEFAULT true,
    tax_withheld DECIMAL(10,2) DEFAULT 0,
    source TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que cada usuário tenha apenas uma configuração
    UNIQUE(user_id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_personal_salary_settings_user_id ON personal_salary_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_salary_settings_active ON personal_salary_settings(is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE personal_salary_settings ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários só podem ver/editar suas próprias configurações
CREATE POLICY "Users can view own salary settings" ON personal_salary_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own salary settings" ON personal_salary_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own salary settings" ON personal_salary_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own salary settings" ON personal_salary_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE personal_salary_settings IS 'Configurações de salário fixo mensal para aplicação automática';
COMMENT ON COLUMN personal_salary_settings.amount IS 'Valor do salário em reais';
COMMENT ON COLUMN personal_salary_settings.payment_day IS 'Dia do mês em que o salário é pago (1-31)';
COMMENT ON COLUMN personal_salary_settings.is_active IS 'Se o salário automático está ativo';
COMMENT ON COLUMN personal_salary_settings.is_taxable IS 'Se o salário está sujeito a impostos';
COMMENT ON COLUMN personal_salary_settings.tax_withheld IS 'Valor do imposto retido na fonte';