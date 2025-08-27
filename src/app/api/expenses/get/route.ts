import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando despesas para usuário:', userId);

    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar despesas:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar despesas' },
        { status: 500 }
      );
    }

    console.log(`✅ ${expenses?.length || 0} despesas encontradas`);

    return NextResponse.json({
      success: true,
      expenses: expenses || []
    });

  } catch (error) {
    console.error('❌ Erro geral ao buscar despesas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 