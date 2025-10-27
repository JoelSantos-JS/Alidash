import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');

    if (!userIdParam) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando receitas para user_id:', userIdParam);

    // Buscar receitas do usuário usando o UUID do Supabase
    const { data: revenues, error: revenuesError } = await supabase
      .from('revenues')
      .select('*')
      .eq('user_id', userIdParam)
      .order('date', { ascending: false });

    if (revenuesError) {
      console.error('❌ Erro ao buscar receitas:', revenuesError);
      return NextResponse.json({ 
        error: 'Erro ao buscar receitas',
        details: revenuesError.message 
      }, { status: 500 });
    }

    console.log(`✅ ${revenues?.length || 0} receitas encontradas`);
    
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

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const revenueData = await request.json();

    console.log('📊 Criando receita via API:', { userId, revenueData });

    // Converter date string para Date object se necessário
    const processedRevenueData = {
      ...revenueData,
      user_id: userId,
      date: typeof revenueData.date === 'string' ? new Date(revenueData.date) : revenueData.date
    };

    // Criar receita no Supabase
    const { data: revenue, error } = await supabase
      .from('revenues')
      .insert(processedRevenueData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar receita no Supabase:', error);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar receita'
      }, { status: 500 });
    }

    console.log('✅ Receita criada com sucesso:', revenue);

    return NextResponse.json({
      success: true,
      revenue
    });

  } catch (error) {
    console.error('❌ Erro ao criar receita:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
}