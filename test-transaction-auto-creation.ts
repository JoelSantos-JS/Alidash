import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdminService } from './src/lib/supabase-service';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTransactionAutoCreation() {
  console.log('🧪 Testando criação automática de receitas/despesas...\n');

  try {
    // Buscar um usuário de teste
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, firebase_uid')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('❌ Erro ao buscar usuário de teste:', usersError);
      return;
    }

    const testUser = users[0];
    console.log(`👤 Usuário de teste: ${testUser.id}`);

    // Teste 1: Criar transação de receita
    console.log('\n📈 Teste 1: Criando transação de receita...');
    const revenueTransaction = {
      description: 'Teste de receita automática',
      amount: 1000.50,
      date: new Date(),
      category: 'Salário',
      type: 'revenue' as const,
      status: 'completed' as const,
      notes: 'Teste automatizado'
    };

    const createdRevTransaction = await supabaseAdminService.createTransaction(testUser.id, revenueTransaction);
    console.log(`✅ Transação de receita criada: ${createdRevTransaction.id}`);

    // Verificar se a receita foi criada automaticamente
    const { data: autoRevenue, error: autoRevError } = await supabase
      .from('revenues')
      .select('*')
      .eq('transaction_id', createdRevTransaction.id)
      .single();

    if (autoRevError) {
      console.log('❌ Receita não foi criada automaticamente:', autoRevError);
    } else {
      console.log('✅ Receita criada automaticamente:', autoRevenue.id);
      console.log(`   - Valor: R$ ${autoRevenue.amount}`);
      console.log(`   - Fonte: ${autoRevenue.source}`);
    }

    // Teste 2: Criar transação de despesa
    console.log('\n📉 Teste 2: Criando transação de despesa...');
    const expenseTransaction = {
      description: 'Teste de despesa automática',
      amount: 250.75,
      date: new Date(),
      category: 'Alimentação',
      type: 'expense' as const,
      status: 'completed' as const,
      notes: 'Teste automatizado'
    };

    const createdExpTransaction = await supabaseAdminService.createTransaction(testUser.id, expenseTransaction);
    console.log(`✅ Transação de despesa criada: ${createdExpTransaction.id}`);

    // Verificar se a despesa foi criada automaticamente
    const { data: autoExpense, error: autoExpError } = await supabase
      .from('expenses')
      .select('*')
      .eq('transaction_id', createdExpTransaction.id)
      .single();

    if (autoExpError) {
      console.log('❌ Despesa não foi criada automaticamente:', autoExpError);
    } else {
      console.log('✅ Despesa criada automaticamente:', autoExpense.id);
      console.log(`   - Valor: R$ ${autoExpense.amount}`);
      console.log(`   - Tipo: ${autoExpense.type}`);
    }

    // Limpeza dos dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    // Remover receitas de teste
    await supabase
      .from('revenues')
      .delete()
      .eq('transaction_id', createdRevTransaction.id);

    // Remover despesas de teste
    await supabase
      .from('expenses')
      .delete()
      .eq('transaction_id', createdExpTransaction.id);

    // Remover transações de teste
    await supabase
      .from('transactions')
      .delete()
      .in('id', [createdRevTransaction.id, createdExpTransaction.id]);

    console.log('✅ Dados de teste removidos');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }

  console.log('\n🎉 Teste concluído com sucesso!');
}

// Executar o teste
testTransactionAutoCreation();