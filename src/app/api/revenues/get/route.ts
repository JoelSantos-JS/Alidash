import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    console.log('🔍 Buscando receitas para user_id:', user.id)
    const supabaseUserId = user.id

    const { data: revenues, error: revenuesError } = await supabase
      .from('revenues')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('date', { ascending: false });

    if (revenuesError) {
      console.error('❌ Erro ao buscar receitas:', revenuesError)
      return NextResponse.json({ 
        error: 'Erro ao buscar receitas',
        details: revenuesError.message 
      }, { status: 500 });
    }

    const { data: installmentTransactions, error: installmentError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', supabaseUserId)
      .eq('type', 'revenue')
      .eq('is_installment', true)
      .order('date', { ascending: false });

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
