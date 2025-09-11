import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar gastos pessoais do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const isEssential = searchParams.get('is_essential');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    console.log('🔍 Buscando gastos pessoais:', { userId, limit, category, isEssential });

    let query = supabase
      .from('personal_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    if (isEssential !== null) {
      query = query.eq('is_essential', isEssential === 'true');
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar gastos pessoais:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Gastos encontrados:', expenses?.length || 0);

    return NextResponse.json({ expenses: expenses || [] });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Deletar despesa pessoal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    console.log('🗑️ Deletando despesa pessoal:', { id, userId });

    if (!id || !userId) {
      return NextResponse.json(
        { success: false, error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Deletar do banco de dados
    const { error } = await supabase
      .from('personal_expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Erro ao deletar despesa do banco:', error);
      return NextResponse.json(
        { success: false, error: `Erro ao deletar despesa: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Despesa pessoal deletada do banco:', id);

    return NextResponse.json({
      success: true,
      message: 'Despesa pessoal deletada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar despesa pessoal:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo gasto pessoal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      date, 
      description, 
      amount, 
      category, 
      payment_method, 
      is_essential = false,
      subcategory,
      location,
      merchant,
      notes
    } = body;

    if (!user_id || !date || !description || !amount || !category || !payment_method) {
      return NextResponse.json({ 
        error: 'user_id, date, description, amount, category e payment_method são obrigatórios' 
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ 
        error: 'Valor deve ser maior que zero' 
      }, { status: 400 });
    }

    console.log('📝 Criando novo gasto pessoal:', { user_id, description, amount, category });

    const { data: expense, error } = await supabase
      .from('personal_expenses')
      .insert({
        user_id,
        date,
        description,
        amount,
        category,
        subcategory,
        payment_method,
        is_essential,
        location,
        merchant,
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar gasto pessoal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Gasto criado:', expense);

    return NextResponse.json({ expense });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}