const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarUsuarioETransacao() {
  console.log('🔧 Criando usuário e transação de teste...');
  
  try {
    const userId = '4a32dbb0-4fe8-4d1c-be21-97d402b41b27';
    
    // Primeiro, tentar criar um usuário
    console.log('👤 Criando usuário de teste...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([{
        id: userId,
        email: 'teste@exemplo.com',
        name: 'Usuário Teste',
        created_at: new Date().toISOString()
      }])
      .select();

    if (userError) {
      console.log('⚠️ Erro ao criar usuário (pode já existir):', userError.message);
    } else {
      console.log('✅ Usuário criado/atualizado:', userData);
    }

    // Agora criar a transação
    console.log('\n💳 Criando transação parcelada...');
    
    const installmentInfo = {
      totalAmount: 2400.00,
      totalInstallments: 12,
      currentInstallment: 3,
      installmentAmount: 200.00,
      remainingAmount: 2000.00,
      nextDueDate: new Date('2025-02-15')
    };

    const transacao = {
      user_id: userId,
      date: new Date().toISOString(),
      description: 'Teste Compra Parcelada - Notebook Dell',
      amount: 200.00,
      type: 'expense',
      category: 'Eletrônicos',
      subcategory: 'Computadores',
      payment_method: 'credit_card',
      status: 'pending',
      notes: 'Transação de teste para debug do InstallmentTransactionCard',
      is_installment: true,
      installment_info: installmentInfo
    };

    console.log('📦 Dados da transação:', JSON.stringify(transacao, null, 2));

    const { data, error } = await supabase
      .from('transactions')
      .insert([transacao])
      .select();

    if (error) {
      console.error('❌ Erro ao criar transação:', error);
      return;
    }

    console.log('✅ Transação criada com sucesso!');
    console.log('📋 Dados inseridos:', JSON.stringify(data, null, 2));

    // Verificar se foi inserida corretamente
    const { data: verificacao, error: errorVerificacao } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_installment', true);

    if (errorVerificacao) {
      console.error('❌ Erro ao verificar transação:', errorVerificacao);
      return;
    }

    console.log(`\n🔍 Verificação: ${verificacao.length} transações parceladas encontradas`);
    
    if (verificacao.length > 0) {
      console.log('📊 Primeira transação parcelada:');
      console.log('- ID:', verificacao[0].id);
      console.log('- Descrição:', verificacao[0].description);
      console.log('- installment_info:', JSON.stringify(verificacao[0].installment_info, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

criarUsuarioETransacao();