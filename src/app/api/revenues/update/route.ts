import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";

export async function PUT(request: NextRequest) {
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
      id,
      description,
      amount,
      category,
      source,
      notes,
      product_id,
      date,
    } = body || {};

    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório" },
        { status: 400 }
      );
    }

    if (!description || !amount || !category || !source || !date) {
      return NextResponse.json(
        {
          error:
            "description, amount, category, source e date são obrigatórios",
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { data: existingRevenue, error: fetchError } = await supabase
      .from("revenues")
      .select("id, user_id, transaction_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingRevenue) {
      return NextResponse.json(
        { error: "Receita não encontrada ou não autorizada" },
        { status: 404 }
      );
    }

    const parsedDate =
      typeof date === "string" ? new Date(date) : new Date(date || Date.now());

    const { data: updatedRevenue, error: updateError } = await supabase
      .from("revenues")
      .update({
        description,
        amount: parseFloat(amount),
        category,
        source,
        notes: notes ?? null,
        product_id: product_id ?? null,
        date: parsedDate,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Erro ao atualizar receita: ${updateError.message}` },
        { status: 500 }
      );
    }

    if (existingRevenue.transaction_id) {
      await supabase
        .from("transactions")
        .update({
          date: parsedDate,
          description,
          amount: parseFloat(amount),
          category,
          notes: notes ?? null,
        })
        .eq("id", existingRevenue.transaction_id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ success: true, revenue: updatedRevenue });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
