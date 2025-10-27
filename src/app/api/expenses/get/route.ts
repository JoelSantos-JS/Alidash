import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');

    if (!userIdParam) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando despesas para user_id:', userIdParam);

    let supabaseUserId = userIdParam;

    // Usar UUID do Supabase diretamente
    console.log('📋 Usando UUID do Supabase:', userIdParam);

    // Buscar despesas regulares do usuário
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('date', { ascending: false });

    if (expensesError) {
      console.error('❌ Erro ao buscar despesas:', expensesError);
      return NextResponse.json({ 
        error: 'Erro ao buscar despesas',
        details: expensesError.message 
      }, { status: 500 });
    }

    // Buscar transações parceladas do usuário
    const { data: installmentTransactions, error: installmentError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', supabaseUserId)
      .eq('type', 'expense')
      .eq('is_installment', true)
      .order('date', { ascending: false });

    if (installmentError) {
      console.error('❌ Erro ao buscar transações parceladas:', installmentError);
      return NextResponse.json({ 
        error: 'Erro ao buscar transações parceladas',
        details: installmentError.message 
      }, { status: 500 });
    }

    console.log(`✅ ${expenses?.length || 0} despesas regulares encontradas`);
    console.log(`✅ ${installmentTransactions?.length || 0} transações parceladas encontradas`);
    
    // Debug detalhado das despesas regulares
    if (expenses && expenses.length > 0) {
      expenses.forEach((expense, index) => {
        console.log(`💰 Despesa regular ${index + 1}:`, {
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          type: expense.type,
          supplier: expense.supplier,
          date: expense.date
        });
      });
    }

    // Debug detalhado das transações parceladas
    if (installmentTransactions && installmentTransactions.length > 0) {
      installmentTransactions.forEach((transaction, index) => {
        console.log(`💳 Transação parcelada ${index + 1}:`, {
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
          type: transaction.type,
          date: transaction.date,
          installment_info: transaction.installment_info
        });
      });
    }

    // Combinar despesas regulares e transações parceladas
    const allExpenses = [
      ...(expenses || []),
      ...(installmentTransactions || [])
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`🎯 Total de despesas (regulares + parceladas): ${allExpenses.length}`);

    return NextResponse.json({
      success: true,
      expenses: allExpenses || []
    });

  } catch (error) {
    console.error('❌ Erro geral ao buscar despesas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}