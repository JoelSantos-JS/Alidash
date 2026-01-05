import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { count: toDeleteCount } = await supabase
      .from('sales')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const { error: resetMetricsError } = await supabase
      .from('products')
      .update({ quantity_sold: 0, actual_profit: 0, roi: 0 })
      .eq('user_id', userId)

    if (resetMetricsError) {
      return NextResponse.json({ error: resetMetricsError.message }, { status: 500 })
    }

    const { error: resetStatusError } = await supabase
      .from('products')
      .update({ status: 'selling' })
      .eq('user_id', userId)
      .eq('status', 'sold')
      .gte('quantity', 1)

    if (resetStatusError) {
      return NextResponse.json({ error: resetStatusError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: toDeleteCount || 0 })
  } catch (_) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
