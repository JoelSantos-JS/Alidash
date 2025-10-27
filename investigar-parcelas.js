const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigarParcelas() {
  console.log('🔍 Investigando sistema de compras parceladas...\n');

  try {
    // 1. Verificar tabelas relacionadas a parcelas
    console.log('📋 1. Verificando tabelas relacionadas a parcelas...');
    
    // Verificar se existe tabela de installments
    const { data: installments, error: installmentsError } = await supabase
      .from('installments')
      .select('*')
      .limit(5);

    if (!installmentsError) {
      console.log(`✅ Tabela 'installments' encontrada com ${installments.length} registros`);
      if (installments.length > 0) {
        console.log('📝 Exemplo de registro:');
        console.log(JSON.stringify(installments[0], null, 2));
      }
    } else {
      console.log('❌ Tabela installments não encontrada ou erro:', installmentsError.message);
    }

    // 2. Verificar transações com informações de parcelas
    console.log('\n📊 2. Verificando transações com informações de parcelas...');
    const { data: transactionsWithInstallments, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .not('installment_info', 'is', null);

    if (!transError) {
      console.log(`✅ Transações com installment_info: ${transactionsWithInstallments.length}`);
      transactionsWithInstallments.forEach((t, i) => {
        console.log(`--- Transação ${i + 1} ---`);
        console.log(`ID: ${t.id}`);
        console.log(`Descrição: ${t.description}`);
        console.log(`É parcela: ${t.is_installment}`);
        console.log(`Installment Info: ${JSON.stringify(t.installment_info, null, 2)}`);
        console.log('');
      });
    } else {
      console.log('❌ Erro ao buscar transações com parcelas:', transError.message);
    }

    // 3. Verificar produtos com informações de parcelas
    console.log('📦 3. Verificando produtos com informações de parcelas...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (!productsError) {
      console.log(`✅ Total de produtos: ${products.length}`);
      
      // Verificar se há produtos com parcelas
      const productsWithInstallments = products.filter(p => 
        p.installment_info || p.is_installment || p.installments
      );
      
      console.log(`📊 Produtos com informações de parcelas: ${productsWithInstallments.length}`);
      
      productsWithInstallments.forEach((p, i) => {
        console.log(`--- Produto ${i + 1} ---`);
        console.log(`ID: ${p.id}`);
        console.log(`Nome: ${p.name}`);
        console.log(`Preço: R$ ${p.selling_price || p.purchase_price}`);
        if (p.installment_info) console.log(`Installment Info: ${JSON.stringify(p.installment_info, null, 2)}`);
        if (p.is_installment) console.log(`É parcela: ${p.is_installment}`);
        if (p.installments) console.log(`Parcelas: ${p.installments}`);
        console.log('');
      });
    } else {
      console.log('❌ Erro ao buscar produtos:', productsError.message);
    }

    // 4. Verificar despesas com parcelas
    console.log('💸 4. Verificando despesas com informações de parcelas...');
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*');

    if (!expensesError) {
      console.log(`✅ Total de despesas: ${expenses.length}`);
      
      const expensesWithInstallments = expenses.filter(e => 
        e.installment_info || e.is_installment || e.installments
      );
      
      console.log(`📊 Despesas com informações de parcelas: ${expensesWithInstallments.length}`);
      
      expensesWithInstallments.forEach((e, i) => {
        console.log(`--- Despesa ${i + 1} ---`);
        console.log(`ID: ${e.id}`);
        console.log(`Descrição: ${e.description}`);
        console.log(`Valor: R$ ${e.amount}`);
        if (e.installment_info) console.log(`Installment Info: ${JSON.stringify(e.installment_info, null, 2)}`);
        if (e.is_installment) console.log(`É parcela: ${e.is_installment}`);
        if (e.installments) console.log(`Parcelas: ${e.installments}`);
        console.log('');
      });
    } else {
      console.log('❌ Erro ao buscar despesas:', expensesError.message);
    }

    // 5. Verificar estrutura das tabelas
    console.log('🔧 5. Verificando estrutura das tabelas principais...');
    
    const tables = ['transactions', 'products', 'expenses', 'revenues'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error && data && data.length > 0) {
          console.log(`\n📋 Estrutura da tabela '${table}':`);
          console.log(Object.keys(data[0]).join(', '));
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar tabela ${table}:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

investigarParcelas();