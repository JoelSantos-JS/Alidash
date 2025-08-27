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

    console.log('🔍 Buscando receitas para usuário:', userId);

    const { data: revenues, error } = await supabase
      .from('revenues')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar receitas:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar receitas' },
        { status: 500 }
      );
    }

    console.log(`✅ ${revenues?.length || 0} receitas encontradas`);
    
    // Debug detalhado das receitas
    if (revenues && revenues.length > 0) {
      revenues.forEach((revenue, index) => {
        console.log(`📊 Receita ${index + 1} do Supabase:`, {
          id: revenue.id,
          description: revenue.description,
          amount: revenue.amount,
          category: revenue.category,
          source: revenue.source,
          date: revenue.date
        });
      });
    }

    return NextResponse.json({
      success: true,
      revenues: revenues || []
    });

  } catch (error) {
    console.error('❌ Erro geral ao buscar receitas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 