import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const id = params.id;
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
    } = body || {};

    if (!id || !user_id) {
      return NextResponse.json(
        { error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (!date || !description || !amount || !category || !source) {
      return NextResponse.json(
        { error: 'date, description, amount, category e source são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from('personal_incomes')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Receita não encontrada ou não autorizada' },
        { status: 404 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('personal_incomes')
      .update({
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
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Erro ao atualizar receita: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ income: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
