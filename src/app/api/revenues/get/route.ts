import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient, createServiceClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const serviceSupabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('start_date')
    const endDateParam = searchParams.get('end_date')
    const startDate = startDateParam ? new Date(startDateParam) : null
    const endDate = endDateParam ? new Date(endDateParam) : null
    const hasStart = !!startDate && !isNaN(startDate.getTime())
    const hasEnd = !!endDate && !isNaN(endDate.getTime())

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    let internalUserId = user.id
    const { data: byId } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()
    if (byId?.id) {
      internalUserId = byId.id
    } else {
      const { data: byFirebase } = await serviceSupabase
        .from('users')
        .select('id')
        .eq('firebase_uid', user.id)
        .single()
      if (byFirebase?.id) internalUserId = byFirebase.id
    }
    console.log('🔍 Buscando receitas para user_id:', internalUserId)

    let revenuesQuery = supabase
      .from('revenues')
      .select('*')
      .eq('user_id', internalUserId)

    if (hasStart) revenuesQuery = revenuesQuery.gte('date', (startDate as Date).toISOString())
    if (hasEnd) revenuesQuery = revenuesQuery.lte('date', (endDate as Date).toISOString())

    const { data: revenues, error: revenuesError } = await revenuesQuery.order('date', { ascending: false });

    if (revenuesError) {
      console.error('❌ Erro ao buscar receitas:', revenuesError)
      return NextResponse.json({ 
        error: 'Erro ao buscar receitas',
        details: revenuesError.message 
      }, { status: 500 });
    }

    let installmentQuery = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', internalUserId)
      .eq('type', 'revenue')
      .eq('is_installment', true)

    if (hasStart) installmentQuery = installmentQuery.gte('date', (startDate as Date).toISOString())
    if (hasEnd) installmentQuery = installmentQuery.lte('date', (endDate as Date).toISOString())

    const { data: installmentTransactions, error: installmentError } = await installmentQuery.order('date', { ascending: false });

    if (installmentError) {
      console.error('❌ Erro ao buscar transações parceladas:', installmentError)
      return NextResponse.json({ 
        error: 'Erro ao buscar transações parceladas',
        details: installmentError.message 
      }, { status: 500 });
    }

    const allRevenues = [
      ...(revenues || []),
      ...(installmentTransactions || [])
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`🎯 Total de receitas (regulares + parceladas): ${allRevenues.length}`)

    return NextResponse.json({
      success: true,
      revenues: allRevenues || []
    });

  } catch (error) {
    console.error('❌ Erro geral ao buscar receitas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
