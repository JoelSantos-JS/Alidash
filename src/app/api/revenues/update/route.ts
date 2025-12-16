"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      user_id,
      description,
      amount,
      category,
      source,
      notes,
      product_id,
      date,
    } = body || {};

    if (!id || !user_id) {
      return NextResponse.json(
        { error: "id e user_id são obrigatórios" },
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

    const { data: existingRevenue, error: fetchError } = await supabase
      .from("revenues")
      .select("id, user_id, transaction_id")
      .eq("id", id)
      .eq("user_id", user_id)
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
      .eq("user_id", user_id)
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
        .eq("user_id", user_id);
    }

    return NextResponse.json({ success: true, revenue: updatedRevenue });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

