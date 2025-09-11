import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Buscar receitas pessoais do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    console.log('🔍 Buscando receitas pessoais:', { userId, limit, category });

    let query = supabase
      .from('personal_incomes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: incomes, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar receitas pessoais:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Receitas encontradas:', incomes?.length || 0);

    return NextResponse.json({ incomes: incomes || [] });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Deletar receita pessoal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    console.log('🗑️ Deletando receita pessoal:', { id, userId });

    if (!id || !userId) {
      return NextResponse.json(
        { success: false, error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Deletar do banco de dados
    const { error } = await supabase
      .from('personal_incomes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Erro ao deletar receita do banco:', error);
      return NextResponse.json(
        { success: false, error: `Erro ao deletar receita: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Receita pessoal deletada do banco:', id);

    return NextResponse.json({
      success: true,
      message: 'Receita pessoal deletada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar receita pessoal:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova receita pessoal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      date, 
      description, 
      amount, 
      category, 
      source,
      is_recurring = false,
      is_taxable = false,
      tax_withheld = 0,
      notes
    } = body;

    if (!user_id || !date || !description || !amount || !category || !source) {
      return NextResponse.json({ 
        error: 'user_id, date, description, amount, category e source são obrigatórios' 
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ 
        error: 'Valor deve ser maior que zero' 
      }, { status: 400 });
    }

    console.log('📝 Criando nova receita pessoal:', { user_id, description, amount, category });

    const { data: income, error } = await supabase
      .from('personal_incomes')
      .insert({
        user_id,
        date,
        description,
        amount,
        category,
        source,
        is_recurring,
        is_taxable,
        tax_withheld,
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar receita pessoal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Receita criada:', income);

    return NextResponse.json({ income });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}