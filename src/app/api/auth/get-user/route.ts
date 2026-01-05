import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const routeStart = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID ou email é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (userId && user.id !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }
    if (email && user.email && user.email !== email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    let resultUser = null;

    if (userId) {
      const { data: userById } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      resultUser = userById || null;
    } else if (email) {
      const { data: userByEmail } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      resultUser = userByEmail || null;
    }

    const total = Date.now() - routeStart;
    const serverTiming = `total;dur=${Math.round(total)}`;
    if (resultUser) {
      return NextResponse.json({ success: true, user: resultUser }, { headers: { 'Server-Timing': serverTiming } });
    } else {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404, headers: { 'Server-Timing': serverTiming } });
    }

  } catch (error) {
    const serverTiming = `total;dur=${Math.round(Date.now() - routeStart)}`;
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500, headers: { 'Server-Timing': serverTiming } });
  }
}
