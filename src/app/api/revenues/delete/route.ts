"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const user_id = searchParams.get("user_id");

    if (!id || !user_id) {
      return NextResponse.json(
        { success: false, error: "id e user_id são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: revenue, error: fetchError } = await supabase
      .from("revenues")
      .select("id, user_id, transaction_id")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (fetchError || !revenue) {
      return NextResponse.json(
        { success: false, error: "Receita não encontrada ou não autorizada" },
        { status: 404 }
      );
    }

    if (revenue.transaction_id) {
      const { error: txDeleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", revenue.transaction_id)
        .eq("user_id", user_id);

      if (txDeleteError) {
        return NextResponse.json(
          { success: false, error: `Erro ao deletar transação: ${txDeleteError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, deleted: id, cascade: true });
    } else {
      const { error: revDeleteError } = await supabase
        .from("revenues")
        .delete()
        .eq("id", id)
        .eq("user_id", user_id);

      if (revDeleteError) {
        return NextResponse.json(
          { success: false, error: `Erro ao deletar receita: ${revDeleteError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, deleted: id, cascade: false });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

