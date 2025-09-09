import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();
    
    // Calcular o último dia do mês corretamente
    const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
    const endDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;

    console.log('🔍 Buscando resumo pessoal:', { userId, targetMonth, targetYear, startDate, endDate });

    // Buscar receitas do mês
    const { data: incomes, error: incomesError } = await supabase
      .from('personal_incomes')
      .select('amount')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (incomesError) {
      console.error('❌ Erro ao buscar receitas:', incomesError);
    }

    // Buscar gastos do mês
    const { data: expenses, error: expensesError } = await supabase
      .from('personal_expenses')
      .select('amount, is_essential')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (expensesError) {
      console.error('❌ Erro ao buscar gastos:', expensesError);
    }

    // Calcular totais
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

    console.log('✅ Resumo calculado:', summary);

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}