import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

// GET - Buscar resumo pessoal do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const month = parseInt(searchParams.get('month') || '0');
    const year = parseInt(searchParams.get('year') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();
    
    const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;

    const { data: incomes, error: incomesError } = await supabase
      .from('personal_incomes')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (incomesError) {
      return NextResponse.json({ error: 'Erro ao buscar receitas' }, { status: 500 });
    }

    const { data: expenses, error: expensesError } = await supabase
      .from('personal_expenses')
      .select('amount, is_essential')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (expensesError) {
      return NextResponse.json({ error: 'Erro ao buscar gastos' }, { status: 500 });
    }

    const totalIncome = incomes?.reduce((sum, income) => sum + Number(income.amount), 0) || 0;
    const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
    const essentialExpenses = expenses?.filter(e => e.is_essential).reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
    const nonEssentialExpenses = totalExpenses - essentialExpenses;
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    const summary = {
      month: targetMonth,
      year: targetYear,
      totalIncome,
      totalExpenses,
      essentialExpenses,
      nonEssentialExpenses,
      balance,
      savingsRate: Math.round(savingsRate * 100) / 100
    };

    return NextResponse.json({ summary });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
