const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInstallmentQuery() {
  try {
    console.log('🔍 Testando query de transações com campos de parcelamento...');
    
    // Buscar todas as transações com campos de parcelamento
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        user_id,
        date,
        description,
        amount,
        type,
        category,
        is_installment,
        installment_info
      `)
      .order('date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erro na query:', error);
      return;
    }

    console.log(`✅ Encontradas ${data.length} transações`);
    
    // Verificar cada transação
    data.forEach((transaction, index) => {
      console.log(`\n📊 Transação ${index + 1}:`);
      console.log(`  ID: ${transaction.id}`);
      console.log(`  Descrição: ${transaction.description}`);
      console.log(`  is_installment: ${transaction.is_installment}`);
      console.log(`  installment_info: ${JSON.stringify(transaction.installment_info, null, 2)}`);
      console.log(`  installment_info type: ${typeof transaction.installment_info}`);
      console.log(`  Tem campos de parcelamento: ${'is_installment' in transaction && 'installment_info' in transaction}`);
      
      if (transaction.is_installment && transaction.installment_info) {
        console.log(`  ✅ É transação parcelada válida!`);
      } else if (transaction.is_installment && !transaction.installment_info) {
        console.log(`  ⚠️ Marcada como parcelada mas sem installment_info`);
      } else {
        console.log(`  ℹ️ Não é transação parcelada`);
      }
    });

    // Contar transações parceladas
    const installmentTransactions = data.filter(t => t.is_installment);
    console.log(`\n📈 Resumo:`);
    console.log(`  Total de transações: ${data.length}`);
    console.log(`  Transações parceladas: ${installmentTransactions.length}`);
    console.log(`  Transações com installment_info: ${data.filter(t => t.installment_info).length}`);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testInstallmentQuery(); 