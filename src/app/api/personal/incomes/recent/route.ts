import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '4');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: incomes, error } = await supabase
      .from('personal_incomes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar receitas' }, { status: 500 });
    }

    const transformedIncomes = incomes?.map(income => ({
      id: income.id,
      description: income.description,
      amount: income.amount,
      category: income.category,
      date: income.date,
      source: income.source || 'Não informado'
    })) || [];

    return NextResponse.json({ incomes: transformedIncomes });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
