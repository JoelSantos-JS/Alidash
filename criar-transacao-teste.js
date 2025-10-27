const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarTransacaoTeste() {
  console.log('🔧 Criando transação de teste parcelada...');
  
  try {
    const installmentInfo = {
      totalAmount: 2400.00,
      totalInstallments: 12,
      currentInstallment: 3,
      installmentAmount: 200.00,
      remainingAmount: 2000.00,
      nextDueDate: new Date('2025-02-15')
    };

    const transacao = {
      user_id: '4a32dbb0-4fe8-4d1c-be21-97d402b41b27',
      date: new Date().toISOString(),
      description: 'Teste Compra Parcelada - Notebook Dell',
      amount: 200.00, // Valor da parcela atual
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
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

criarTransacaoTeste();