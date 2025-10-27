const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugMenuParcelas() {
  console.log('🔍 === DEBUG MENU COMPRAS PARCELADAS ===\n');

  try {
    // 1. Verificar se existem transações com is_installment = true
    console.log('1️⃣ Verificando transações parceladas...');
    const { data: installmentTransactions, error: installmentError } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_installment', true);

    if (installmentError) {
      console.error('❌ Erro ao buscar transações parceladas:', installmentError);
    } else {
      console.log(`✅ Transações parceladas encontradas: ${installmentTransactions.length}`);
      if (installmentTransactions.length > 0) {
        console.log('📋 Detalhes das transações parceladas:');
        installmentTransactions.forEach((t, index) => {
          console.log(`   ${index + 1}. ID: ${t.id}`);
          console.log(`      Descrição: ${t.description}`);
          console.log(`      Valor: R$ ${t.amount}`);
          console.log(`      Data: ${t.date}`);
          console.log(`      Info Parcelas: ${t.installment_info}`);
          console.log(`      Status: ${t.status}`);
          console.log('');
        });
      }
    }

    // 2. Verificar todas as transações para o usuário específico
    console.log('\n2️⃣ Verificando todas as transações do usuário...');
    const { data: allTransactions, error: allError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b')
      .order('date', { ascending: false });

    if (allError) {
      console.error('❌ Erro ao buscar todas as transações:', allError);
    } else {
      console.log(`✅ Total de transações do usuário: ${allTransactions.length}`);
      if (allTransactions.length > 0) {
        console.log('📋 Resumo das transações:');
        allTransactions.forEach((t, index) => {
          console.log(`   ${index + 1}. ${t.description} - R$ ${t.amount} - Parcelada: ${t.is_installment ? 'SIM' : 'NÃO'}`);
        });
      }
    }

    // 3. Testar a função isInstallmentTransaction
    console.log('\n3️⃣ Testando função isInstallmentTransaction...');
    
    function isInstallmentTransaction(transaction) {
      return Boolean(transaction.isInstallment && transaction.installmentInfo);
    }

    if (allTransactions && allTransactions.length > 0) {
      const convertedTransactions = allTransactions.map(t => ({
        ...t,
        isInstallment: Boolean(t.is_installment),
        installmentInfo: t.installment_info
      }));

      const installmentFiltered = convertedTransactions.filter(isInstallmentTransaction);
      console.log(`✅ Transações identificadas como parceladas pela função: ${installmentFiltered.length}`);
      
      if (installmentFiltered.length > 0) {
        console.log('📋 Transações parceladas filtradas:');
        installmentFiltered.forEach((t, index) => {
          console.log(`   ${index + 1}. ${t.description} - R$ ${t.amount}`);
        });
      }
    }

    // 4. Verificar estrutura da tabela transactions
    console.log('\n4️⃣ Verificando estrutura da tabela transactions...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'transactions' })
      .single();

    if (tableError) {
      console.log('⚠️ Não foi possível obter info da tabela via RPC, tentando query direta...');
      
      // Tentar uma query simples para ver as colunas
      const { data: sampleTransaction, error: sampleError } = await supabase
        .from('transactions')
        .select('*')
        .limit(1)
        .single();

      if (!sampleError && sampleTransaction) {
        console.log('✅ Colunas disponíveis na tabela transactions:');
        Object.keys(sampleTransaction).forEach(column => {
          console.log(`   - ${column}: ${typeof sampleTransaction[column]}`);
        });
      }
    }

    // 5. Criar uma transação parcelada de teste
    console.log('\n5️⃣ Criando transação parcelada de teste...');
    
    const testInstallmentTransaction = {
      user_id: 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b',
      description: 'Teste Compra Parcelada - Notebook',
      amount: 2400.00,
      type: 'expense',
      category: 'Eletrônicos',
      subcategory: 'Computadores',
      payment_method: 'Cartão de Crédito',
      status: 'pending',
      date: new Date().toISOString(),
      is_installment: true,
      installment_info: JSON.stringify({
        totalInstallments: 12,
        currentInstallment: 1,
        installmentAmount: 200.00,
        startDate: new Date().toISOString(),
        description: 'Notebook Dell - 12x de R$ 200,00'
      })
    };

    const { data: newTransaction, error: insertError } = await supabase
      .from('transactions')
      .insert([testInstallmentTransaction])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar transação de teste:', insertError);
    } else {
      console.log('✅ Transação parcelada de teste criada com sucesso!');
      console.log(`   ID: ${newTransaction.id}`);
      console.log(`   Descrição: ${newTransaction.description}`);
      console.log(`   Valor: R$ ${newTransaction.amount}`);
      console.log(`   Parcelada: ${newTransaction.is_installment}`);
      console.log(`   Info Parcelas: ${newTransaction.installment_info}`);
    }

    // 6. Verificar novamente após inserção
    console.log('\n6️⃣ Verificando transações parceladas após inserção...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_installment', true);

    if (!finalError) {
      console.log(`✅ Total de transações parceladas agora: ${finalCheck.length}`);
    }

  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
  }
}

debugMenuParcelas();