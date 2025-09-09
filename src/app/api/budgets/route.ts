import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar orçamento do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    console.log('🔍 Buscando orçamento para usuário:', userId);

    const { data: budget, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Erro ao buscar orçamento:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Se não encontrou orçamento, criar um padrão
    if (!budget) {
      console.log('📝 Criando orçamento padrão para usuário:', userId);
      
      const { data: newBudget, error: createError } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          monthly_budget: 600.00
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar orçamento:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      return NextResponse.json({ budget: newBudget });
    }

    console.log('✅ Orçamento encontrado:', budget);
    return NextResponse.json({ budget });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// PUT - Atualizar orçamento do usuário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, monthly_budget } = body;

    if (!user_id || monthly_budget === undefined) {
      return NextResponse.json({ 
        error: 'user_id e monthly_budget são obrigatórios' 
      }, { status: 400 });
    }

    if (monthly_budget < 0) {
      return NextResponse.json({ 
        error: 'Orçamento deve ser maior ou igual a zero' 
      }, { status: 400 });
    }

    console.log('📝 Atualizando orçamento:', { user_id, monthly_budget });

    // Primeiro, tentar atualizar
    const { data: updatedBudget, error: updateError } = await supabase
      .from('budgets')
      .update({ 
        monthly_budget,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError && updateError.code === 'PGRST116') {
      // Se não existe, criar novo
      console.log('📝 Orçamento não existe, criando novo...');
      
      const { data: newBudget, error: createError } = await supabase
        .from('budgets')
        .insert({
          user_id,
          monthly_budget
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar orçamento:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      console.log('✅ Orçamento criado:', newBudget);
      return NextResponse.json({ budget: newBudget });
    }

    if (updateError) {
      console.error('❌ Erro ao atualizar orçamento:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log('✅ Orçamento atualizado:', updatedBudget);
    return NextResponse.json({ budget: updatedBudget });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}