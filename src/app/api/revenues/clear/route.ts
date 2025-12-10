import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const onlySale = (searchParams.get('only_sale') || 'false').toLowerCase() === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    let count = 0

    if (onlySale) {
      const { count: c } = await supabase
        .from('revenues')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('source', 'sale')
      count = c || 0
      const { error } = await supabase
        .from('revenues')
        .delete()
        .eq('user_id', userId)
        .eq('source', 'sale')
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const { count: c } = await supabase
        .from('revenues')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
      count = c || 0
      const { error } = await supabase
        .from('revenues')
        .delete()
        .eq('user_id', userId)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, deleted: count })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

