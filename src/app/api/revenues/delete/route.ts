import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { data: revenue, error: fetchError } = await supabase
      .from("revenues")
      .select("id, user_id, transaction_id")
      .eq("id", id)
      .eq("user_id", user.id)
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
        .eq("user_id", user.id);

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
        .eq("user_id", user.id);

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
