import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

// GET - Buscar orçamento do usuário
export async function GET(request: NextRequest) {
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

    const { data: budget, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Se não encontrou orçamento, criar um padrão
    if (!budget) {
      const { data: newBudget, error: createError } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          monthly_budget: 600.00
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      return NextResponse.json({ budget: newBudget });
    }

    return NextResponse.json({ budget });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar orçamento do usuário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, monthly_budget } = body;

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (user_id && user_id !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (monthly_budget === undefined) {
      return NextResponse.json({ 
        error: 'user_id e monthly_budget são obrigatórios' 
      }, { status: 400 });
    }

    if (monthly_budget < 0) {
      return NextResponse.json({ 
        error: 'Orçamento deve ser maior ou igual a zero' 
      }, { status: 400 });
    }

    // Primeiro, tentar atualizar
    const { data: updatedBudget, error: updateError } = await supabase
      .from('budgets')
      .update({ 
        monthly_budget,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError && updateError.code === 'PGRST116') {
      // Se não existe, criar novo
      const { data: newBudget, error: createError } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          monthly_budget
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      return NextResponse.json({ budget: newBudget });
    }

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ budget: updatedBudget });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
