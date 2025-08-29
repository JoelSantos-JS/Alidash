// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Configuração Supabase:');
console.log('- URL:', supabaseUrl ? 'Definida' : 'Não definida');
console.log('- Service Key:', supabaseServiceKey ? 'Definida' : 'Não definida');
console.log('- Anon Key:', supabaseAnonKey ? 'Definida' : 'Não definida');

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não está definida');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não está definida');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
  console.log('\n🔍 Testando conectividade com Supabase...');
  
  try {
    // Teste 1: Verificar se consegue conectar
    console.log('1. Testando conexão básica...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro na conexão básica:', testError);
      return;
    }
    
    console.log('✅ Conexão básica OK');
    
    // Teste 2: Buscar usuários existentes
    console.log('\n2. Buscando usuários existentes...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, firebase_uid')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    console.log('✅ Usuários encontrados:', users.length);
    if (users.length > 0) {
      console.log('Primeiro usuário:', {
        id: users[0].id,
        email: users[0].email,
        firebase_uid: users[0].firebase_uid
      });
      
      // Teste 3: Tentar inserir uma transação com usuário válido
      console.log('\n3. Testando inserção de transação com usuário válido...');
      const testTransaction = {
        user_id: users[0].id, // Usar ID válido do usuário
        date: new Date().toISOString(),
        description: 'Teste de transação',
        amount: 100.00,
        type: 'expense',
        category: 'teste',
        payment_method: 'pix',
        status: 'completed',
        is_installment: false,
        installment_info: null
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('transactions')
        .insert(testTransaction)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro ao inserir transação de teste:', insertError);
        console.error('Detalhes do erro:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
      } else {
        console.log('✅ Transação de teste inserida com sucesso:', insertData.id);
        
        // Teste 4: Verificar se a transação foi realmente inserida
        console.log('\n4. Verificando transação inserida...');
        const { data: verifyData, error: verifyError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', insertData.id)
          .single();
        
        if (verifyError) {
          console.error('❌ Erro ao verificar transação:', verifyError);
        } else {
          console.log('✅ Transação verificada:', {
            id: verifyData.id,
            description: verifyData.description,
            amount: verifyData.amount,
            is_installment: verifyData.is_installment,
            installment_info: verifyData.installment_info
          });
        }
        
        // Limpar transação de teste
        await supabase
          .from('transactions')
          .delete()
          .eq('id', insertData.id);
        
        console.log('✅ Transação de teste removida');
      }
      
      // Teste 5: Testar transação parcelada
      console.log('\n5. Testando transação parcelada...');
      const installmentTransaction = {
        user_id: users[0].id,
        date: new Date().toISOString(),
        description: 'Teste de transação parcelada',
        amount: 1200.00,
        type: 'expense',
        category: 'cartão',
        payment_method: 'credit_card',
        status: 'completed',
        is_installment: true,
        installment_info: JSON.stringify({
          totalAmount: 1200.00,
          totalInstallments: 12,
          currentInstallment: 1,
          installmentAmount: 100.00,
          remainingAmount: 1100.00,
          nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      };
      
      const { data: installmentData, error: installmentError } = await supabase
        .from('transactions')
        .insert(installmentTransaction)
        .select()
        .single();
      
      if (installmentError) {
        console.error('❌ Erro ao inserir transação parcelada:', installmentError);
        console.error('Detalhes do erro:', {
          code: installmentError.code,
          message: installmentError.message,
          details: installmentError.details,
          hint: installmentError.hint
        });
      } else {
        console.log('✅ Transação parcelada inserida com sucesso:', installmentData.id);
        
        // Limpar transação parcelada de teste
        await supabase
          .from('transactions')
          .delete()
          .eq('id', installmentData.id);
        
        console.log('✅ Transação parcelada de teste removida');
      }
      
    } else {
      console.log('⚠️ Nenhum usuário encontrado. Crie um usuário primeiro.');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Executar teste
testSupabaseConnection()
  .then(() => {
    console.log('\n✅ Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro no teste:', error);
    process.exit(1);
  }); 