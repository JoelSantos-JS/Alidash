import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

// GET - Buscar despesas pessoais do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const category = searchParams.get('category');
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    console.log('🔍 Buscando despesas pessoais:', { userId, limit, category, month: monthParam, year: yearParam });

    let query = supabase
      .from('personal_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Aplicar filtro por categoria quando informado
    if (category) {
      query = query.eq('category', category);
    }

    // Aplicar filtro por mês/ano quando informado
    if (monthParam && yearParam) {
      const month = parseInt(monthParam);
      const year = parseInt(yearParam);
      if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
        const lastDay = new Date(year, month, 0).getDate();
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
        query = query.gte('date', startDate).lte('date', endDate);
      }
    } else if (yearParam && !monthParam) {
      // Permitir filtro por ano isolado
      const year = parseInt(yearParam);
      if (!isNaN(year)) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        query = query.gte('date', startDate).lte('date', endDate);
      }
    }

    // Aplicar limite somente quando informado
    if (typeof limit === 'number' && !isNaN(limit)) {
      query = query.limit(limit);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar despesas pessoais:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Despesas encontradas:', expenses?.length || 0);

    return NextResponse.json({ expenses: expenses || [] });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar nova despesa pessoal
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin') || ''
      const normalize = (u: string) => u.replace(/\/+$/, '')
      const allowed = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => normalize(s.trim()))
        .filter(Boolean)
      const appUrl = normalize((process.env.NEXT_PUBLIC_APP_URL || '').trim())
      const current = normalize(origin)
      const isAllowed = allowed.length ? allowed.includes(current) : (appUrl ? current === appUrl : true)
      if (!isAllowed) {
        return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
      }
    }
    const body = await request.json();
    const { 
      user_id, 
      date, 
      description, 
      amount, 
      category, 
      subcategory,
      payment_method,
      is_essential = false,
      is_recurring = false,
      location,
      merchant,
      notes
    } = body;

    console.log('📝 Dados recebidos para criação de despesa:', { 
      user_id, 
      date, 
      description, 
      amount, 
      category, 
      payment_method,
      is_essential,
      is_recurring,
      location,
      merchant,
      notes
    });

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

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    console.log('💸 Criando nova despesa pessoal:', { user_id, description, amount, category });

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
        is_recurring,
        location,
        merchant,
        notes
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar despesa pessoal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Despesa criada:', expense);

    return NextResponse.json({ expense });

  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Deletar despesa pessoal
export async function DELETE(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin') || ''
      const normalize = (u: string) => u.replace(/\/+$/, '')
      const allowed = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => normalize(s.trim()))
        .filter(Boolean)
      const appUrl = normalize((process.env.NEXT_PUBLIC_APP_URL || '').trim())
      const current = normalize(origin)
      const isAllowed = allowed.length ? allowed.includes(current) : (appUrl ? current === appUrl : true)
      if (!isAllowed) {
        return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
      }
    }
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('id');
    const userId = searchParams.get('user_id');

    if (!expenseId || !userId) {
      return NextResponse.json(
        { error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    console.log('🗑️ Deletando despesa pessoal:', { expenseId, userId });

    // Verificar se a despesa pertence ao usuário antes de deletar
    const { data: expense, error: fetchError } = await supabase
      .from('personal_expenses')
      .select('id, user_id')
      .eq('id', expenseId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !expense) {
      console.error('❌ Despesa não encontrada ou não pertence ao usuário:', fetchError);
      return NextResponse.json(
        { error: 'Despesa não encontrada ou não autorizada' },
        { status: 404 }
      );
    }

    // Deletar a despesa
    const { error: deleteError } = await supabase
      .from('personal_expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('❌ Erro ao deletar despesa:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao deletar despesa' },
        { status: 500 }
      );
    }

    console.log('✅ Despesa deletada com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Despesa deletada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro interno ao deletar despesa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
