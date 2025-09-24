require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSalarySettingsTable() {
  console.log('🔧 Criando tabela de configurações de salário...');
  
  try {
    // Primeiro, vamos tentar criar a tabela usando uma inserção de teste
    // para verificar se a tabela já existe
    const { data: existingTable, error: checkError } = await supabase
      .from('personal_salary_settings')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ Tabela personal_salary_settings já existe!');
      return;
    }

    console.log('📝 Tabela não existe, vamos criá-la...');
    console.log('');
    console.log('🔧 INSTRUÇÕES MANUAIS:');
    console.log('');
    console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Vá para seu projeto');
    console.log('3. Clique em "SQL Editor" no menu lateral');
    console.log('4. Cole e execute o seguinte SQL:');
    console.log('');
    console.log('-- ========================================');
    console.log('-- CRIAR TABELA DE CONFIGURAÇÕES DE SALÁRIO');
    console.log('-- ========================================');
    console.log('');
    console.log(`CREATE TABLE IF NOT EXISTS personal_salary_settings (
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
    FOR DELETE USING (auth.uid() = user_id);`);
    console.log('');
    console.log('-- ========================================');
    console.log('');
    console.log('5. Clique em "Run" para executar o SQL');
    console.log('6. Após executar, execute este script novamente para verificar');
    console.log('');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createSalarySettingsTable();