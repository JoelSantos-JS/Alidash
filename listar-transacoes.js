const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listarTransacoes() {
  console.log('🔍 Listando todas as transações no banco de dados...\n');

  try {
    // Buscar todas as transações
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar transações:', error);
      return;
    }

    console.log(`📊 Total de transações encontradas: ${transactions.length}\n`);

    if (transactions.length === 0) {
      console.log('ℹ️ Nenhuma transação encontrada no banco de dados.');
      return;
    }

    // Listar cada transação
    transactions.forEach((transaction, index) => {
      console.log(`--- Transação ${index + 1} ---`);
      console.log(`ID: ${transaction.id}`);
      console.log(`Descrição: ${transaction.description}`);
      console.log(`Valor: R$ ${transaction.amount}`);
      console.log(`Tipo: ${transaction.type}`);
      console.log(`Categoria: ${transaction.category}`);
      console.log(`Data: ${transaction.date}`);
      console.log(`Usuário: ${transaction.user_id}`);
      console.log(`Criado em: ${transaction.created_at}`);
      if (transaction.source) console.log(`Fonte: ${transaction.source}`);
      if (transaction.recurrence) console.log(`Recorrência: ${transaction.recurrence}`);
      console.log('');
    });

    // Resumo por tipo
    const receitas = transactions.filter(t => t.type === 'receita');
    const despesas = transactions.filter(t => t.type === 'despesa');

    console.log('📈 RESUMO POR TIPO:');
    console.log(`Receitas: ${receitas.length} (Total: R$ ${receitas.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)})`);
    console.log(`Despesas: ${despesas.length} (Total: R$ ${despesas.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)})`);

    // Resumo por usuário
    const usuarios = [...new Set(transactions.map(t => t.user_id))];
    console.log('\n👥 RESUMO POR USUÁRIO:');
    usuarios.forEach(userId => {
      const userTransactions = transactions.filter(t => t.user_id === userId);
      console.log(`Usuário ${userId}: ${userTransactions.length} transações`);
    });

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

listarTransacoes();