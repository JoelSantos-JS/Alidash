const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verificarTransacoesExistentes() {
  try {
    console.log('🔍 Verificando todas as transações no banco...\n');

    // 1. Buscar todas as transações
    const { data: allTransactions, error: allError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Erro ao buscar transações:', allError.message);
      return;
    }

    console.log(`📊 Total de transações encontradas: ${allTransactions.length}\n`);

    if (allTransactions.length > 0) {
      console.log('📋 Primeiras 5 transações:');
      allTransactions.slice(0, 5).forEach((t, index) => {
        console.log(`${index + 1}. ID: ${t.id}`);
        console.log(`   User ID: ${t.user_id}`);
        console.log(`   Descrição: ${t.description}`);
        console.log(`   Valor: R$ ${t.amount}`);
        console.log(`   Parcelada: ${t.is_installment}`);
        console.log(`   Info Parcelas: ${t.installment_info ? 'SIM' : 'NÃO'}`);
        console.log(`   Data: ${t.created_at}`);
        console.log('');
      });

      // 2. Verificar transações parceladas
      const installmentTransactions = allTransactions.filter(t => t.is_installment === true);
      console.log(`💳 Transações parceladas: ${installmentTransactions.length}\n`);

      if (installmentTransactions.length > 0) {
        console.log('📋 Transações parceladas encontradas:');
        installmentTransactions.forEach((t, index) => {
          console.log(`${index + 1}. ${t.description}`);
          console.log(`   User ID: ${t.user_id}`);
          console.log(`   Valor: R$ ${t.amount}`);
          if (t.installment_info) {
            const info = t.installment_info;
            console.log(`   Total: R$ ${info.totalAmount}`);
            console.log(`   Parcelas: ${info.currentInstallment}/${info.totalInstallments}`);
            console.log(`   Restante: R$ ${info.remainingAmount}`);
          }
          console.log('');
        });
      }

      // 3. Verificar user_ids únicos
      const uniqueUserIds = [...new Set(allTransactions.map(t => t.user_id))];
      console.log(`👥 User IDs únicos encontrados: ${uniqueUserIds.length}`);
      uniqueUserIds.forEach((userId, index) => {
        const userTransactions = allTransactions.filter(t => t.user_id === userId);
        console.log(`${index + 1}. ${userId} (${userTransactions.length} transações)`);
      });

    } else {
      console.log('❌ Nenhuma transação encontrada no banco de dados.');
      console.log('💡 Isso explica por que o menu de parcelas está vazio.');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarTransacoesExistentes();