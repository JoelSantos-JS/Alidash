import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const routeStart = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (userIdParam && userIdParam !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Buscar despesas do usuário usando o UUID do Supabase
    const dbStart = Date.now();
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    // Buscar transações parceladas de despesa
    const { data: installmentTransactions, error: installmentError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('is_installment', true)
      .order('date', { ascending: false });
    const dbDur = Date.now() - dbStart;

    if (expensesError) {
      return NextResponse.json({ 
        error: 'Erro ao buscar despesas'
      }, { status: 500 });
    }

    if (installmentError) {
      return NextResponse.json({ 
        error: 'Erro ao buscar transações parceladas'
      }, { status: 500 });
    }

    // Combinar despesas regulares e transações parceladas
    const allExpenses = [
      ...(expenses || []),
      ...(installmentTransactions || [])
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const total = Date.now() - routeStart;
    const serverTiming = `db;dur=${Math.round(dbDur)}, total;dur=${Math.round(total)}`;
    return NextResponse.json({ success: true, expenses: allExpenses || [] }, { headers: { 'Server-Timing': serverTiming } });

  } catch (error) {
    const total = Date.now() - routeStart;
    const serverTiming = `total;dur=${Math.round(total)}`;
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500, headers: { 'Server-Timing': serverTiming } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (userId && userId !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const expenseData = await request.json();

    // Converter date string para Date object se necessário
    const processedExpenseData = {
      ...expenseData,
      user_id: user.id,
      date: typeof expenseData?.date === 'string' ? new Date(expenseData.date).toISOString() : expenseData?.date
    };

    // Criar despesa no Supabase
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(processedExpenseData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar despesa'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      expense
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
