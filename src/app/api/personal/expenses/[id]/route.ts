import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
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
    } = body || {};

    if (!id || !user_id) {
      return NextResponse.json(
        { error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    if (!date || !description || !amount || !category || !payment_method) {
      return NextResponse.json(
        { error: 'date, description, amount, category e payment_method são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchError } = await supabase
      .from('personal_expenses')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Despesa não encontrada ou não autorizada' },
        { status: 404 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('personal_expenses')
      .update({
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
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Erro ao atualizar despesa: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ expense: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

