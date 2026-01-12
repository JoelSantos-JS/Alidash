import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient, createServiceClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const routeStart = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');

    const supabaseAuth = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (userIdParam && userIdParam !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const serviceSupabase = createServiceClient()
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

    // Buscar receitas do usuário usando o UUID do Supabase
    const dbStart = Date.now();
    const { data: revenues, error: revenuesError } = await serviceSupabase
      .from('revenues')
      .select('*')
      .eq('user_id', internalUserId)
      .order('date', { ascending: false });
    const dbDur = Date.now() - dbStart;

    if (revenuesError) {
      return NextResponse.json({ 
        error: 'Erro ao buscar receitas'
      }, { status: 500 });
    }
    
    const total = Date.now() - routeStart;
    const serverTiming = `db;dur=${Math.round(dbDur)}, total;dur=${Math.round(total)}`;
    return NextResponse.json({ success: true, revenues: revenues || [] }, { headers: { 'Server-Timing': serverTiming } });

  } catch (error) {
    const total = Date.now() - routeStart;
    const serverTiming = `total;dur=${Math.round(total)}`;
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500, headers: { 'Server-Timing': serverTiming } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');

    const supabaseAuth = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (userIdParam && userIdParam !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const revenueData = await request.json();

    const serviceSupabase = createServiceClient()
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

    // Converter date string para Date object se necessário
    const processedRevenueData = {
      ...revenueData,
      user_id: internalUserId,
      date: typeof revenueData?.date === 'string' ? new Date(revenueData.date).toISOString() : revenueData?.date
    };

    // Criar receita no Supabase
    const { data: revenue, error } = await serviceSupabase
      .from('revenues')
      .insert(processedRevenueData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar receita'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      revenue
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
