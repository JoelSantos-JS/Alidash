import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

// GET - Buscar receitas pessoais do usuário
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

    console.log('🔍 Buscando receitas pessoais:', { userId, limit, category, month: monthParam, year: yearParam });

    let query = supabase
      .from('personal_incomes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    // Filtro por mês/ano quando informado
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
      const year = parseInt(yearParam);
      if (!isNaN(year)) {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        query = query.gte('date', startDate).lte('date', endDate);
      }
    }

    // Aplicar limite apenas quando informado
    if (typeof limit === 'number' && !isNaN(limit)) {
      query = query.limit(limit);
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
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

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

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
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
