const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function corrigirTransacaoCorrempida() {
  try {
    console.log('🔧 Corrigindo transação parcelada corrompida...\n');

    // 1. Buscar a transação corrompida (user_id: d550e8ce-d151-4a33-9d8f-4f7cf8886c9b)
    const { data: transacaoCorrempida, error: buscarError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b')
      .eq('is_installment', true)
      .single();

    if (buscarError) {
      console.error('❌ Erro ao buscar transação corrompida:', buscarError.message);
      return;
    }

    console.log('📋 Transação corrompida encontrada:');
    console.log(`ID: ${transacaoCorrempida.id}`);
    console.log(`Descrição: ${transacaoCorrempida.description}`);
    console.log(`Valor: R$ ${transacaoCorrempida.amount}`);
    console.log(`Info atual:`, transacaoCorrempida.installment_info);
    console.log('');

    // 2. Corrigir os dados do installment_info
    const installmentInfoCorrigido = {
      totalAmount: 2400.00,
      totalInstallments: 12,
      currentInstallment: 1,
      installmentAmount: 200.00,
      remainingAmount: 2200.00,
      nextDueDate: new Date('2025-11-17').toISOString()
    };

    // 3. Atualizar a transação
    const { data: transacaoAtualizada, error: atualizarError } = await supabase
      .from('transactions')
      .update({
        amount: 200.00, // Corrigir o valor da parcela
        installment_info: installmentInfoCorrigido
      })
      .eq('id', transacaoCorrempida.id)
      .select()
      .single();

    if (atualizarError) {
      console.error('❌ Erro ao atualizar transação:', atualizarError.message);
      return;
    }

    console.log('✅ Transação corrigida com sucesso!');
    console.log('📋 Dados atualizados:');
    console.log(`Valor da parcela: R$ ${transacaoAtualizada.amount}`);
    console.log(`Info corrigida:`, transacaoAtualizada.installment_info);
    console.log('');

    // 4. Verificar se a correção funcionou
    console.log('🔍 Verificando todas as transações parceladas após correção...');
    const { data: todasParceladas, error: verificarError } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_installment', true);

    if (!verificarError && todasParceladas) {
      console.log(`📊 Total de transações parceladas: ${todasParceladas.length}`);
      todasParceladas.forEach((t, index) => {
        console.log(`${index + 1}. ${t.description}`);
        console.log(`   User ID: ${t.user_id}`);
        console.log(`   Valor: R$ ${t.amount}`);
        if (t.installment_info) {
          const info = t.installment_info;
          console.log(`   Total: R$ ${info.totalAmount}`);
          console.log(`   Parcelas: ${info.currentInstallment}/${info.totalInstallments}`);
          console.log(`   Valor parcela: R$ ${info.installmentAmount}`);
          console.log(`   Restante: R$ ${info.remainingAmount}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

corrigirTransacaoCorrempida();