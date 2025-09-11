import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    console.log('🔍 Buscando despesas recentes:', { userId, limit });

    // Buscar despesas recentes do usuário
    const { data: expenses, error } = await supabase
      .from('personal_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Erro ao buscar despesas:', error);
      return NextResponse.json({ error: 'Erro ao buscar despesas' }, { status: 500 });
    }

    // Transformar dados para o formato esperado
    const transformedExpenses = expenses?.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      is_essential: expense.is_essential,
      payment_method: expense.payment_method
    })) || [];

    console.log('✅ Despesas recentes encontradas:', transformedExpenses.length);

    return NextResponse.json({ expenses: transformedExpenses });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}