import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers'

export async function POST(_request: NextRequest) {
  const routeStart = Date.now();
  try {
    const supabase = await createSupabaseClient();
    const { error } = await supabase.auth.signOut();
    try {
      const cookieStore = await cookies()
      const all = cookieStore.getAll()
      all.forEach((c) => {
        const name = c.name
        if (name.startsWith('sb-') || name.includes('supabase') || name.includes('auth-token')) {
          try { cookieStore.delete(name) } catch {}
          try { cookieStore.set(name, '', { path: '/', maxAge: 0 }) } catch {}
        }
      })
    } catch {}

    const total = Date.now() - routeStart;
    const serverTiming = `total;dur=${Math.round(total)}`;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400, headers: { 'Server-Timing': serverTiming } }
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: { 'Server-Timing': serverTiming } }
    );
  } catch (error) {
    const serverTiming = `total;dur=${Math.round(Date.now() - routeStart)}`;
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500, headers: { 'Server-Timing': serverTiming } }
    );
  }
}
