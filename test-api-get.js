// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testApiGet() {
  console.log('🔍 Testando API route de listagem...');
  
  try {
    // 1. Buscar um usuário real
    console.log('1. Buscando usuário...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ Nenhum usuário encontrado');
      return;
    }
    
    const userId = users[0].id;
    console.log('✅ Usuário encontrado:', userId);
    
    // 2. Testar API route diretamente
    console.log('\n2. Testando API route...');
    const response = await fetch(`http://localhost:9002/api/transactions/get?user_id=${userId}`);
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📊 Resposta completa:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ API funcionando:', {
        count: result.count,
        transactions: result.transactions?.length || 0
      });
    } else {
      console.error('❌ Erro na API:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testApiGet()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  }); 