require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura das tabelas revenues e expenses...\n');

  try {
    // Verificar estrutura da tabela revenues
    console.log('📊 Estrutura da tabela revenues:');
    const { data: revenuesColumns, error: revenuesError } = await supabase
      .rpc('get_table_columns', { table_name: 'revenues' });

    if (revenuesError) {
      console.log('❌ Erro ao obter colunas de revenues:', revenuesError);
      
      // Tentar uma abordagem alternativa
      const { data: sampleRevenue, error: sampleError } = await supabase
        .from('revenues')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('❌ Erro ao obter amostra de revenues:', sampleError);
      } else {
        console.log('✅ Colunas encontradas em revenues:', Object.keys(sampleRevenue[0] || {}));
      }
    } else {
      console.log('✅ Colunas de revenues:', revenuesColumns);
    }

    // Verificar estrutura da tabela expenses
    console.log('\n📊 Estrutura da tabela expenses:');
    const { data: expensesColumns, error: expensesError } = await supabase
      .rpc('get_table_columns', { table_name: 'expenses' });

    if (expensesError) {
      console.log('❌ Erro ao obter colunas de expenses:', expensesError);
      
      // Tentar uma abordagem alternativa
      const { data: sampleExpense, error: sampleError } = await supabase
        .from('expenses')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('❌ Erro ao obter amostra de expenses:', sampleError);
      } else {
        console.log('✅ Colunas encontradas em expenses:', Object.keys(sampleExpense[0] || {}));
      }
    } else {
      console.log('✅ Colunas de expenses:', expensesColumns);
    }

    // Verificar se existe alguma receita ou despesa
    console.log('\n📈 Verificando dados existentes...');
    
    const { data: revenuesCount, error: revCountError } = await supabase
      .from('revenues')
      .select('id', { count: 'exact' });
    
    if (!revCountError) {
      console.log(`✅ Total de receitas: ${revenuesCount.length}`);
    }

    const { data: expensesCount, error: expCountError } = await supabase
      .from('expenses')
      .select('id', { count: 'exact' });
    
    if (!expCountError) {
      console.log(`✅ Total de despesas: ${expensesCount.length}`);
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

checkTableStructure();