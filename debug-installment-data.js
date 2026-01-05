const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables not configured')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugInstallmentData() {
  console.log('🔍 Verificando dados de installmentInfo...');
  
  try {
    // Primeiro, buscar TODAS as transações para ver o que temos
    const { data: allTransactions, error: allError } = await supabase
      .from('transactions')
      .select('*');

    if (allError) {
      console.error('❌ Erro ao buscar todas as transações:', allError);
      return;
    }

    console.log(`📊 Total de transações no banco: ${allTransactions.length}`);
    
    // Verificar quantas têm is_installment = true
    const installmentTransactions = allTransactions.filter(t => t.is_installment === true);
    console.log(`💳 Transações com is_installment=true: ${installmentTransactions.length}`);
    
    // Verificar se há transações com installment_info
    const withInstallmentInfo = allTransactions.filter(t => t.installment_info !== null);
    console.log(`📋 Transações com installment_info não nulo: ${withInstallmentInfo.length}`);
    
    // Mostrar algumas transações para debug
    console.log('\n📝 Primeiras 3 transações:');
    allTransactions.slice(0, 3).forEach((transaction, index) => {
      console.log(`\n${index + 1}. ${transaction.description}`);
      console.log(`   is_installment: ${transaction.is_installment}`);
      console.log(`   installment_info: ${JSON.stringify(transaction.installment_info)}`);
    });
    
    // Buscar transações com parcelas especificamente
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_installment', true);

    if (error) {
      console.error('❌ Erro ao buscar transações parceladas:', error);
      return;
    }

    console.log(`\n✅ Encontradas ${transactions.length} transações parceladas`);
    
    transactions.forEach((transaction, index) => {
      console.log(`\n📦 Transação ${index + 1}:`);
      console.log('ID:', transaction.id);
      console.log('Descrição:', transaction.description);
      console.log('is_installment:', transaction.is_installment);
      console.log('installment_info tipo:', typeof transaction.installment_info);
      console.log('installment_info valor:', JSON.stringify(transaction.installment_info, null, 2));
      
      // Verificar se installment_info tem as propriedades necessárias
      if (transaction.installment_info) {
        const info = transaction.installment_info;
        console.log('Propriedades disponíveis:', Object.keys(info));
        console.log('totalAmount:', info.totalAmount);
        console.log('remainingAmount:', info.remainingAmount);
        console.log('currentInstallment:', info.currentInstallment);
        console.log('totalInstallments:', info.totalInstallments);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugInstallmentData();
