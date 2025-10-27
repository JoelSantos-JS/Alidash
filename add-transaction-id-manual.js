require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTransactionIdColumns() {
  console.log('🔧 Verificando e adicionando colunas transaction_id...\n');

  try {
    // Verificar se as colunas já existem
    console.log('🔍 Verificando estrutura atual das tabelas...');
    
    const { data: revenuesSample } = await supabase
      .from('revenues')
      .select('*')
      .limit(1);
    
    const { data: expensesSample } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);

    const revenuesHasTransactionId = revenuesSample && revenuesSample[0] && revenuesSample[0].hasOwnProperty('transaction_id');
    const expensesHasTransactionId = expensesSample && expensesSample[0] && expensesSample[0].hasOwnProperty('transaction_id');

    console.log(`📊 Revenues tem transaction_id: ${revenuesHasTransactionId ? '✅' : '❌'}`);
    console.log(`📊 Expenses tem transaction_id: ${expensesHasTransactionId ? '✅' : '❌'}`);

    if (!revenuesHasTransactionId || !expensesHasTransactionId) {
      console.log('\n⚠️  As colunas transaction_id precisam ser adicionadas manualmente no Supabase Dashboard.');
      console.log('\n📋 Instruções para adicionar as colunas:');
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá para Table Editor');
      console.log('3. Para a tabela "revenues":');
      console.log('   - Clique em "Add Column"');
      console.log('   - Nome: transaction_id');
      console.log('   - Tipo: uuid');
      console.log('   - Foreign Key: transactions(id)');
      console.log('   - On Delete: CASCADE');
      console.log('4. Para a tabela "expenses":');
      console.log('   - Clique em "Add Column"');
      console.log('   - Nome: transaction_id');
      console.log('   - Tipo: uuid');
      console.log('   - Foreign Key: transactions(id)');
      console.log('   - On Delete: CASCADE');
      
      console.log('\n🔧 Alternativamente, execute este SQL no SQL Editor do Supabase:');
      console.log(`
-- Adicionar coluna transaction_id à tabela revenues
ALTER TABLE revenues 
ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- Adicionar coluna transaction_id à tabela expenses
ALTER TABLE expenses 
ADD COLUMN transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_revenues_transaction_id ON revenues(transaction_id);
CREATE INDEX IF NOT EXISTS idx_expenses_transaction_id ON expenses(transaction_id);
      `);
    } else {
      console.log('\n✅ Todas as colunas transaction_id já existem!');
    }

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

addTransactionIdColumns();