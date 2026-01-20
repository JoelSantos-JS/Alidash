import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  const routeStart = Date.now();
  try {
    const supabase = await createSupabaseClient();
    const { error } = await supabase.auth.signOut();

    const total = Date.now() - routeStart;
    const serverTiming = `total;dur=${Math.round(total)}`;

    if (error) {
      const res = NextResponse.json(
        { success: false, error: error.message },
        { status: 400, headers: { 'Server-Timing': serverTiming } }
      );
      request.cookies.getAll().forEach((c) => {
        const name = c.name;
        if (name.startsWith('sb-') || name.includes('supabase') || name.includes('auth-token')) {
          res.cookies.set(name, '', { path: '/', maxAge: 0 });
        }
      });
      return res;
    }

    const res = NextResponse.json(
      { success: true },
      { headers: { 'Server-Timing': serverTiming } }
    );
    request.cookies.getAll().forEach((c) => {
      const name = c.name;
      if (name.startsWith('sb-') || name.includes('supabase') || name.includes('auth-token')) {
        res.cookies.set(name, '', { path: '/', maxAge: 0 });
      }
    });
    return res;
  } catch (error) {
    const serverTiming = `total;dur=${Math.round(Date.now() - routeStart)}`;
    const res = NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500, headers: { 'Server-Timing': serverTiming } }
    );
    request.cookies.getAll().forEach((c) => {
      const name = c.name;
      if (name.startsWith('sb-') || name.includes('supabase') || name.includes('auth-token')) {
        res.cookies.set(name, '', { path: '/', maxAge: 0 });
      }
    });
    return res;
  }
}
