import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');

    if (!userIdParam) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando despesas para user_id:', userIdParam);

    // Buscar despesas do usuário usando o UUID do Supabase
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userIdParam)
      .order('date', { ascending: false });

    if (expensesError) {
      console.error('❌ Erro ao buscar despesas:', expensesError);
      return NextResponse.json({ 
        error: 'Erro ao buscar despesas',
        details: expensesError.message 
      }, { status: 500 });
    }

    console.log(`✅ ${expenses?.length || 0} despesas encontradas`);
    
    return NextResponse.json({
      success: true,
      expenses: expenses || []
    });

  } catch (error) {
    console.error('❌ Erro geral ao buscar despesas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const expenseData = await request.json();

    console.log('💰 Criando despesa via API:', { userId, expenseData });

    // Converter date string para Date object se necessário
    const processedExpenseData = {
      ...expenseData,
      user_id: userId,
      date: typeof expenseData.date === 'string' ? new Date(expenseData.date) : expenseData.date
    };

    // Criar despesa no Supabase
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(processedExpenseData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar despesa no Supabase:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar despesa'
      }, { status: 500 });
    }

    console.log('✅ Despesa criada com sucesso:', expense);

    return NextResponse.json({
      success: true,
      expense
    });

  } catch (error) {
    console.error('❌ Erro ao criar despesa:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
}