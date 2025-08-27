const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://atyeakcunmhrzzpdcvxm.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0eWVha2N1bm1ocnp6cGRjdnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3MjM0MSwiZXhwIjoyMDcxNDQ4MzQxfQ.RYbe-ygQ43m_I7COUhPmgmPmlCilCimZHSW2W7uqRkU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // 1. Verificar usuários existentes
    console.log('1. Verificando usuários existentes...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid, email')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }
    
    console.log('✅ Usuários encontrados:', users.length);
    users.forEach(user => {
      console.log(`   - ID: ${user.id}, Firebase UID: ${user.firebase_uid || 'NULL'}, Email: ${user.email}`);
    });

    // 2. Verificar despesas existentes
    console.log('\n2. Verificando despesas existentes...');
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .limit(10);
    
    if (expensesError) {
      console.error('❌ Erro ao buscar despesas:', expensesError);
      return;
    }
    
    console.log('✅ Despesas encontradas:', expenses.length);
    expenses.forEach(expense => {
      console.log(`   - ID: ${expense.id}, User ID: ${expense.user_id}, Descrição: ${expense.description}, Valor: R$ ${expense.amount}`);
    });

    // 3. Se houver usuários, tentar criar uma despesa para o primeiro usuário
    if (users.length > 0) {
      const firstUserId = users[0].id;
      console.log(`\n3. Testando criação de despesa para usuário: ${firstUserId}`);
      
      const testExpense = {
        user_id: firstUserId,
        date: new Date().toISOString(),
        description: 'Teste de Despesa - ' + new Date().toLocaleString(),
        amount: 150.00,
        category: 'Teste',
        type: 'other',
        notes: 'Despesa de teste para verificar funcionamento'
      };

      const { data: newExpense, error: createError } = await supabase
        .from('expenses')
        .insert(testExpense)
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar despesa:', createError);
      } else {
        console.log('✅ Despesa criada com sucesso:', newExpense.id);
        
        // Deletar a despesa de teste
        console.log('4. Deletando despesa de teste...');
        const { error: deleteError } = await supabase
          .from('expenses')
          .delete()
          .eq('id', newExpense.id);
        
        if (deleteError) {
          console.error('❌ Erro ao deletar despesa:', deleteError);
        } else {
          console.log('✅ Despesa de teste deletada');
        }
      }
    }

    // 4. Verificar se há usuários com Firebase UID
    console.log('\n5. Verificando usuários com Firebase UID...');
    const { data: usersWithFirebase, error: firebaseError } = await supabase
      .from('users')
      .select('id, firebase_uid, email')
      .not('firebase_uid', 'is', null);
    
    if (firebaseError) {
      console.error('❌ Erro ao buscar usuários com Firebase UID:', firebaseError);
    } else {
      console.log('✅ Usuários com Firebase UID:', usersWithFirebase.length);
      if (usersWithFirebase.length === 0) {
        console.log('⚠️ NENHUM usuário tem Firebase UID configurado!');
        console.log('💡 Isso explica por que as despesas não aparecem na aplicação.');
        console.log('💡 A aplicação busca usuários pelo Firebase UID, mas todos estão NULL.');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testSupabaseConnection().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 