// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

console.log('🔧 Verificando variáveis de ambiente...');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Definida' : 'Não definida');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Definida' : 'Não definida');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Definida' : 'Não definida');

// Simular o que acontece no supabase-service.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔧 Configuração Supabase:');
console.log('- URL:', supabaseUrl ? 'Definida' : 'Não definida');
console.log('- Anon Key:', supabaseAnonKey ? 'Definida' : 'Não definida');
console.log('- Service Key:', supabaseServiceKey ? 'Definida' : 'Não definida');

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is required');
  process.exit(1);
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  process.exit(1);
}

console.log('\n✅ Todas as variáveis de ambiente estão definidas');

// Testar criação do cliente
const { createClient } = require('@supabase/supabase-js');

try {
  console.log('\n🔧 Criando cliente Supabase...');
  
  // Client-side Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Cliente Supabase criado (anon)');
  
  // Server-side Supabase client (for API routes)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  console.log('✅ Cliente Supabase Admin criado');
  
  // Testar conexão
  console.log('\n🔍 Testando conexão...');
  const { data: testData, error: testError } = await supabaseAdmin
    .from('users')
    .select('count')
    .limit(1);
  
  if (testError) {
    console.error('❌ Erro na conexão:', testError);
  } else {
    console.log('✅ Conexão testada com sucesso');
  }
  
} catch (error) {
  console.error('❌ Erro ao criar cliente:', error);
} 