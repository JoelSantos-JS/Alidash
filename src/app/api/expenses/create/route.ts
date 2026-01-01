import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('account_type, created_at, plan_started_at')
      .eq('id', user.id)
      .single()
    
    const resolvedUser = userError || !userRow
      ? { account_type: 'personal', created_at: new Date().toISOString(), plan_started_at: null }
      : userRow

    const isPaid = resolvedUser.account_type === 'pro' || resolvedUser.account_type === 'basic'
    if (!isPaid) {
      const startAt = resolvedUser.plan_started_at ? new Date(resolvedUser.plan_started_at) : (resolvedUser.created_at ? new Date(resolvedUser.created_at) : new Date())
      const diffDays = Math.floor((Date.now() - startAt.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 5) {
        return NextResponse.json({ error: 'Período gratuito de 5 dias expirado' }, { status: 403 })
      }
    }
    if (resolvedUser.account_type === 'basic') {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const startIso = start.toISOString()
      const endIso = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString()

      const { count, error: countError } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('date', startIso)
        .lte('date', endIso)

      if (countError) {
        return NextResponse.json({ error: 'Erro ao validar limite do plano' }, { status: 500 })
      }

      if ((count ?? 0) >= 1000) {
        return NextResponse.json({ error: 'Limite mensal de transações do plano Básico atingido' }, { status: 403 })
      }
    }

    const expenseData = await request.json();

    console.log('💰 Criando despesa via API:', { userId: user.id, expenseData });

    // Converter date string para Date object se necessário
    const processedExpenseData = {
      ...expenseData,
      user_id: user.id,
      date: typeof expenseData.date === 'string' ? new Date(expenseData.date) : expenseData.date
    };

    // 1. Primeiro criar a transação
    const transactionData = {
      user_id: user.id,
      date: processedExpenseData.date,
      description: processedExpenseData.description,
      amount: processedExpenseData.amount,
      type: 'expense',
      category: processedExpenseData.category || 'Despesas Gerais',
      subcategory: processedExpenseData.subcategory || null,
      payment_method: processedExpenseData.payment_method || 'pix', // Usar 'pix' como padrão em vez de 'other'
      status: 'completed',
      notes: processedExpenseData.notes || null,
      tags: [],
      is_installment: false,
      installment_info: null
    };

    console.log('🔄 Criando transação para despesa:', transactionData);

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error('❌ Erro ao criar transação:', transactionError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar transação'
      }, { status: 500 });
    }

    console.log('✅ Transação criada com sucesso:', transaction.id);

    // 2. Agora criar a despesa com referência à transação
    const expenseWithTransaction = {
      ...processedExpenseData,
      transaction_id: transaction.id
    };

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(expenseWithTransaction)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar despesa no Supabase:', error);
      
      // Se falhar ao criar a despesa, remover a transação criada
      await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      return NextResponse.json({
        success: false,
        error: 'Erro ao criar despesa'
      }, { status: 500 });
    }

    console.log('✅ Despesa criada com sucesso:', expense);

    return NextResponse.json({
      success: true,
      expense,
      transaction
    });

  } catch (error) {
    console.error('❌ Erro ao criar despesa:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
}
