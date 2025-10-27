const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'Não definida');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Definida' : 'Não definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createCatalogTokensTable() {
  try {
    console.log('📋 Criando tabela catalog_tokens...');
    
    // Criar tabela diretamente
    const createTableQuery = `
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
    `;
    
    const { data: tableData, error: tableError } = await supabase
      .from('catalog_tokens')
      .select('*')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST116') {
      console.log('🔧 Tabela não existe, tentando criar via SQL Editor...');
      console.log('');
      console.log('🚨 AÇÃO NECESSÁRIA:');
      console.log('1. Acesse: https://supabase.com/dashboard/project/atyeakcunmhrzzpdcvxm/sql');
      console.log('2. Cole e execute o seguinte SQL:');
      console.log('');
      console.log('-- Criar tabela catalog_tokens');
      console.log(createTableQuery);
      console.log('');
      console.log('-- Criar índices');
      console.log('CREATE INDEX IF NOT EXISTS idx_catalog_tokens_user_id ON public.catalog_tokens(user_id);');
      console.log('CREATE INDEX IF NOT EXISTS idx_catalog_tokens_token ON public.catalog_tokens(token);');
      console.log('CREATE INDEX IF NOT EXISTS idx_catalog_tokens_active ON public.catalog_tokens(is_active);');
      console.log('');
      console.log('-- Habilitar RLS');
      console.log('ALTER TABLE public.catalog_tokens ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- Políticas RLS');
      console.log('CREATE POLICY "Users can view own catalog tokens" ON public.catalog_tokens FOR SELECT USING (auth.uid() = user_id);');
      console.log('CREATE POLICY "Users can insert own catalog tokens" ON public.catalog_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);');
      console.log('CREATE POLICY "Users can update own catalog tokens" ON public.catalog_tokens FOR UPDATE USING (auth.uid() = user_id);');
      console.log('CREATE POLICY "Users can delete own catalog tokens" ON public.catalog_tokens FOR DELETE USING (auth.uid() = user_id);');
      console.log('');
      console.log('3. Após executar, teste novamente a funcionalidade');
      
    } else if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError);
    } else {
      console.log('✅ Tabela catalog_tokens já existe!');
      console.log('📊 Dados encontrados:', tableData?.length || 0, 'registros');
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

createCatalogTokensTable();