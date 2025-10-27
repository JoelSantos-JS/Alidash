const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarEstrutura() {
  console.log('🔍 === VERIFICANDO ESTRUTURA REAL DA TABELA ===\n');

  try {
    // 1. Verificar se a coluna installment_info existe
    console.log('1️⃣ Verificando se installment_info existe...');
    
    const { data: testQuery, error: testError } = await supabase
      .from('transactions')
      .select('installment_info')
      .limit(1);

    if (testError) {
      console.log('❌ Coluna installment_info NÃO existe:', testError.message);
      
      // Tentar adicionar a coluna
      console.log('\n2️⃣ Tentando adicionar coluna installment_info...');
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_info JSONB;'
      });
      
      if (alterError) {
        console.log('❌ Não foi possível adicionar coluna via RPC:', alterError.message);
      } else {
        console.log('✅ Coluna installment_info adicionada com sucesso!');
      }
    } else {
      console.log('✅ Coluna installment_info existe!');
    }

    // 3. Verificar valores válidos para payment_method
    console.log('\n3️⃣ Verificando valores válidos para payment_method...');
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('payment_method')
      .not('payment_method', 'is', null);

    if (!transError && transactions) {
      const uniquePaymentMethods = [...new Set(transactions.map(t => t.payment_method))];
      console.log('✅ Métodos de pagamento existentes:', uniquePaymentMethods);
    }

    // 4. Tentar criar transação com método de pagamento válido
    console.log('\n4️⃣ Criando transação parcelada com método válido...');
    
    const testTransaction = {
      user_id: 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b',
      description: 'Teste Compra Parcelada - Notebook Dell',
      amount: 2400.00,
      type: 'expense',
      category: 'Eletrônicos',
      subcategory: 'Computadores',
      payment_method: 'credit_card', // Usando snake_case
      status: 'pending',
      date: new Date().toISOString(),
      is_installment: true,
      installment_info: {
        totalInstallments: 12,
        currentInstallment: 1,
        installmentAmount: 200.00,
        startDate: new Date().toISOString(),
        description: 'Notebook Dell - 12x de R$ 200,00'
      }
    };

    const { data: newTransaction, error: insertError } = await supabase
      .from('transactions')
      .insert([testTransaction])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar transação:', insertError);
      
      // Tentar com outros valores
      console.log('\n5️⃣ Tentando com valores diferentes...');
      
      const testTransaction2 = {
        user_id: 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b',
        description: 'Teste Compra Parcelada - Smartphone',
        amount: 1200.00,
        type: 'expense',
        category: 'Eletrônicos',
        payment_method: 'pix', // Tentando PIX
        status: 'completed',
        date: new Date().toISOString(),
        is_installment: true
      };

      const { data: newTransaction2, error: insertError2 } = await supabase
        .from('transactions')
        .insert([testTransaction2])
        .select()
        .single();

      if (insertError2) {
        console.error('❌ Erro ao criar segunda transação:', insertError2);
      } else {
        console.log('✅ Segunda transação criada com sucesso!');
        console.log(`   ID: ${newTransaction2.id}`);
        console.log(`   Descrição: ${newTransaction2.description}`);
      }
    } else {
      console.log('✅ Transação parcelada criada com sucesso!');
      console.log(`   ID: ${newTransaction.id}`);
      console.log(`   Descrição: ${newTransaction.description}`);
    }

    // 6. Verificar transações parceladas finais
    console.log('\n6️⃣ Verificação final de transações parceladas...');
    const { data: finalTransactions, error: finalError } = await supabase
      .from('transactions')
      .select('*')
      .eq('is_installment', true);

    if (!finalError) {
      console.log(`✅ Total de transações parceladas: ${finalTransactions.length}`);
      if (finalTransactions.length > 0) {
        finalTransactions.forEach((t, index) => {
          console.log(`   ${index + 1}. ${t.description} - R$ ${t.amount} - Método: ${t.payment_method}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarEstrutura();