// Teste simplificado para verificar dados no Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando variáveis de ambiente ou valores padrão)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variáveis de ambiente do Supabase não configuradas');
  console.log('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
  console.log('🧪 Testando conexão com Supabase...\n');
  
  try {
    // 1. Testar conexão básica
    console.log('1️⃣ Testando conexão básica...');
    const { data, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      return;
    }
    
    console.log('✅ Conexão com Supabase estabelecida');
    
    // 2. Verificar estrutura das tabelas
    console.log('\n2️⃣ Verificando estrutura das tabelas...');
    
    // Verificar tabela transactions
    const { data: transactionsSchema, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
    
    if (transactionsError) {
      console.error('❌ Erro ao acessar tabela transactions:', transactionsError.message);
    } else {
      console.log('✅ Tabela transactions acessível');
    }
    
    // Verificar tabela revenues
    const { data: revenuesSchema, error: revenuesError } = await supabase
      .from('revenues')
      .select('*')
      .limit(1);
    
    if (revenuesError) {
      console.error('❌ Erro ao acessar tabela revenues:', revenuesError.message);
    } else {
      console.log('✅ Tabela revenues acessível');
    }
    
    // Verificar tabela expenses
    const { data: expensesSchema, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    if (expensesError) {
      console.error('❌ Erro ao acessar tabela expenses:', expensesError.message);
    } else {
      console.log('✅ Tabela expenses acessível');
    }
    
    // 3. Contar registros existentes
    console.log('\n3️⃣ Contando registros existentes...');
    
    const { count: transactionsCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { count: revenuesCount } = await supabase
      .from('revenues')
      .select('*', { count: 'exact', head: true });
    
    const { count: expensesCount } = await supabase
      .from('expenses')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Registros encontrados:`);
    console.log(`   - Transações: ${transactionsCount || 0}`);
    console.log(`   - Receitas: ${revenuesCount || 0}`);
    console.log(`   - Despesas: ${expensesCount || 0}`);
    
    // 4. Mostrar alguns registros recentes
    console.log('\n4️⃣ Mostrando registros recentes...');
    
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('id, description, amount, type, date, user_id')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (recentTransactions && recentTransactions.length > 0) {
      console.log('📋 Transações recentes:');
      recentTransactions.forEach((t, index) => {
        console.log(`   ${index + 1}. ${t.description} - R$ ${t.amount} (${t.type}) - User: ${t.user_id}`);
      });
    } else {
      console.log('📋 Nenhuma transação encontrada');
    }
    
    const { data: recentRevenues } = await supabase
      .from('revenues')
      .select('id, description, amount, category, date, user_id')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (recentRevenues && recentRevenues.length > 0) {
      console.log('\n💰 Receitas recentes:');
      recentRevenues.forEach((r, index) => {
        console.log(`   ${index + 1}. ${r.description} - R$ ${r.amount} (${r.category}) - User: ${r.user_id}`);
      });
    } else {
      console.log('\n💰 Nenhuma receita encontrada');
    }
    
    // 5. Verificar usuários únicos
    console.log('\n5️⃣ Verificando usuários únicos...');
    
    const { data: uniqueUsers } = await supabase
      .from('transactions')
      .select('user_id')
      .not('user_id', 'is', null);
    
    const userIds = [...new Set(uniqueUsers?.map(u => u.user_id) || [])];
    console.log(`👥 ${userIds.length} usuários únicos encontrados nas transações`);
    
    if (userIds.length > 0) {
      console.log('   Primeiros 3 user_ids:', userIds.slice(0, 3));
    }
    
    console.log('\n🎉 Teste de conexão concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

// Executar o teste
testSupabaseConnection();