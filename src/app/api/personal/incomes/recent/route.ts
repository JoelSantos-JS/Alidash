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
    const limit = parseInt(searchParams.get('limit') || '4');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    console.log('🔍 Buscando receitas recentes:', { userId, limit });

    // Buscar receitas recentes do usuário
    const { data: incomes, error } = await supabase
      .from('personal_incomes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Erro ao buscar receitas:', error);
      return NextResponse.json({ error: 'Erro ao buscar receitas' }, { status: 500 });
    }

    // Transformar dados para o formato esperado
    const transformedIncomes = incomes?.map(income => ({
      id: income.id,
      description: income.description,
      amount: income.amount,
      category: income.category,
      date: income.date,
      source: income.source || 'Não informado'
    })) || [];

    console.log('✅ Receitas recentes encontradas:', transformedIncomes.length);

    return NextResponse.json({ incomes: transformedIncomes });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}