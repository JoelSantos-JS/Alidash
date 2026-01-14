import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function POST() {
  const routeStart = Date.now();
  try {
    const supabase = await createSupabaseClient();
    const { error } = await supabase.auth.signOut();

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

