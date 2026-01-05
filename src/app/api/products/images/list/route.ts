import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const productId = searchParams.get('product_id')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('page_size') || '6', 10)

    if (!userId || !productId) {
      return NextResponse.json({ error: 'user_id e product_id são obrigatórios' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
      .from('product_images')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .order('type', { ascending: true })
      .order('order', { ascending: true })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, images: data || [], page, page_size: pageSize, total: count || 0 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
