import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    const startDate = startDateParam ? new Date(startDateParam) : null;
    const endDate = endDateParam ? new Date(endDateParam) : null;
    const hasStart = !!startDate && !isNaN(startDate.getTime());
    const hasEnd = !!endDate && !isNaN(endDate.getTime());

    let expensesQuery = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id);

    if (hasStart) expensesQuery = expensesQuery.gte('date', (startDate as Date).toISOString());
    if (hasEnd) expensesQuery = expensesQuery.lte('date', (endDate as Date).toISOString());

    const { data: expenses, error: expensesError } = await expensesQuery.order('date', { ascending: false });

    if (expensesError) {
      return NextResponse.json({ 
        error: 'Erro ao buscar despesas',
        details: expensesError.message 
      }, { status: 500 });
    }

    let installmentQuery = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('is_installment', true);

    if (hasStart) installmentQuery = installmentQuery.gte('date', (startDate as Date).toISOString());
    if (hasEnd) installmentQuery = installmentQuery.lte('date', (endDate as Date).toISOString());

    const { data: installmentTransactions, error: installmentError } = await installmentQuery.order('date', { ascending: false });

    if (installmentError) {
      return NextResponse.json({ 
        error: 'Erro ao buscar transações parceladas',
        details: installmentError.message 
      }, { status: 500 });
    }

    const allExpenses = [
      ...(expenses || []),
      ...(installmentTransactions || [])
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      expenses: allExpenses || []
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
