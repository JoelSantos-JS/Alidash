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

async function testApiDirect() {
  console.log('🔍 Testando API route diretamente...');
  
  try {
    // 1. Primeiro, buscar um usuário real no Supabase
    console.log('1. Buscando usuário real no Supabase...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, firebase_uid')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ Nenhum usuário encontrado no Supabase');
      return;
    }
    
    const realUser = users[0];
    console.log('✅ Usuário real encontrado:', {
      id: realUser.id,
      email: realUser.email,
      firebase_uid: realUser.firebase_uid
    });
    
    // 2. Buscar o usuário via API usando dados reais
    console.log('\n2. Buscando usuário via API...');
    const userResponse = await fetch(`http://localhost:9002/api/auth/get-user?firebase_uid=${realUser.firebase_uid || 'test'}&email=${realUser.email}`);
    
    if (userResponse.ok) {
      const userResult = await userResponse.json();
      console.log('✅ Usuário encontrado via API:', userResult.user?.id);
      
      // 3. Testar criação de transação
      console.log('\n3. Testando criação de transação...');
      const transactionData = {
        user_id: userResult.user.id,
        transaction: {
          id: new Date().getTime().toString(),
          date: new Date(),
          description: 'Teste via API',
          amount: 100.00,
          type: 'expense',
          category: 'teste',
          subcategory: null,
          paymentMethod: 'pix',
          status: 'completed',
          notes: null,
          tags: [],
          productId: null,
          isInstallment: false,
          installmentInfo: null
        }
      };
      
      console.log('📝 Dados enviados:', {
        user_id: transactionData.user_id,
        description: transactionData.transaction.description,
        isInstallment: transactionData.transaction.isInstallment
      });
      
      const createResponse = await fetch('http://localhost:9002/api/transactions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      });
      
      console.log('📊 Status da resposta:', createResponse.status);
      console.log('📊 Headers da resposta:', Object.fromEntries(createResponse.headers.entries()));
      
      const responseText = await createResponse.text();
      console.log('📊 Resposta completa:', responseText);
      
      if (createResponse.ok) {
        const result = JSON.parse(responseText);
        console.log('✅ Transação criada via API:', result.id);
      } else {
        console.error('❌ Erro na API:', responseText);
      }
    } else {
      console.error('❌ Erro ao buscar usuário via API:', await userResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testApiDirect()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  }); 