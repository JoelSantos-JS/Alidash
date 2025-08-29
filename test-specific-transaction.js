// Teste específico para a transação com problema
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSpecificTransaction() {
  console.log('🔍 Testando transação específica...');
  
  const transactionId = '51e7f92a-59f1-437b-a3af-3c25fdf32c29';
  const userId = 'f06c3c27-5862-4332-96f2-d0f1e62bf9cc';
  
  try {
    // 1. Buscar a transação específica
    console.log('\n1️⃣ Buscando transação específica:', transactionId);
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar transação:', error);
      return;
    }
    
    if (!transaction) {
      console.log('❌ Transação não encontrada!');
      return;
    }
    
    console.log('✅ Transação encontrada:');
    console.log('  ID:', transaction.id);
    console.log('  Descrição:', transaction.description);
    console.log('  Valor:', transaction.amount);
    console.log('  is_installment:', transaction.is_installment, '(tipo:', typeof transaction.is_installment, ')');
    console.log('  installment_info:', transaction.installment_info, '(tipo:', typeof transaction.installment_info, ')');
    
    // 2. Verificar se installment_info é válido
    if (transaction.installment_info) {
      try {
        let parsedInfo;
        if (typeof transaction.installment_info === 'string') {
          parsedInfo = JSON.parse(transaction.installment_info);
          console.log('  installment_info parseado:', parsedInfo);
        } else {
          parsedInfo = transaction.installment_info;
          console.log('  installment_info (já objeto):', parsedInfo);
        }
        
        console.log('  ✅ installment_info é válido');
        console.log('    - totalAmount:', parsedInfo.totalAmount);
        console.log('    - totalInstallments:', parsedInfo.totalInstallments);
        console.log('    - currentInstallment:', parsedInfo.currentInstallment);
        console.log('    - installmentAmount:', parsedInfo.installmentAmount);
        console.log('    - remainingAmount:', parsedInfo.remainingAmount);
        
      } catch (parseError) {
        console.error('  ❌ Erro ao fazer parse do installment_info:', parseError);
      }
    } else {
      console.log('  ⚠️ installment_info está null/undefined');
    }
    
    // 3. Buscar todas as transações do usuário para comparar
    console.log('\n2️⃣ Buscando todas as transações do usuário:', userId);
    const { data: allTransactions, error: allError } = await supabase
      .from('transactions')
      .select('id, description, is_installment, installment_info')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Erro ao buscar todas as transações:', allError);
      return;
    }
    
    console.log(`✅ Encontradas ${allTransactions.length} transações do usuário`);
    
    // Contar transações parceladas
    const installmentTransactions = allTransactions.filter(t => t.is_installment);
    const transactionsWithInfo = allTransactions.filter(t => t.installment_info);
    
    console.log('📊 Estatísticas:');
    console.log('  Total de transações:', allTransactions.length);
    console.log('  Transações com is_installment=true:', installmentTransactions.length);
    console.log('  Transações com installment_info preenchido:', transactionsWithInfo.length);
    
    // Mostrar transações parceladas
    if (installmentTransactions.length > 0) {
      console.log('\n💳 Transações parceladas encontradas:');
      installmentTransactions.forEach((t, index) => {
        console.log(`  ${index + 1}. ${t.description}`);
        console.log(`     - is_installment: ${t.is_installment}`);
        console.log(`     - installment_info: ${t.installment_info ? 'presente' : 'ausente'}`);
      });
    } else {
      console.log('\n❌ Nenhuma transação parcelada encontrada!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSpecificTransaction().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(error => {
  console.error('❌ Erro no teste:', error);
});