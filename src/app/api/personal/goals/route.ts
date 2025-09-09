import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar metas pessoais do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    console.log('🔍 Buscando metas pessoais:', { userId, status, type });

    let query = supabase
      .from('personal_goals')
      .select('*')
      .eq('user_id', userId)
      .order('deadline', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: goals, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar metas:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calcular progresso para cada meta
    const goalsWithProgress = goals?.map(goal => {
      const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
      return {
        ...goal,
        progress_percentage: Math.min(progress, 100)
      };
    }) || [];

    console.log('✅ Metas encontradas:', goalsWithProgress.length);

    return NextResponse.json({ goals: goalsWithProgress });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar nova meta pessoal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, name, description, type, target_amount, deadline, priority } = body;

    if (!user_id || !name || !type || !target_amount || !deadline) {
      return NextResponse.json({ 
        error: 'user_id, name, type, target_amount e deadline são obrigatórios' 
      }, { status: 400 });
    }

    console.log('📝 Criando nova meta:', { user_id, name, type, target_amount });

    const { data: goal, error } = await supabase
      .from('personal_goals')
      .insert({
        user_id,
        name,
        description,
        type,
        target_amount,
        current_amount: 0,
        deadline,
        priority: priority || 'medium',
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar meta:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Meta criada:', goal);

    return NextResponse.json({ goal });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}