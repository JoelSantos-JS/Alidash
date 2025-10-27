import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    let supabaseUserId = userIdParam;

    // Usar UUID do Supabase diretamente
    console.log('📋 Usando UUID do Supabase:', userIdParam);

    // Buscar receitas regulares do usuário
    const { data: revenues, error: revenuesError } = await supabase
      .from('revenues')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('date', { ascending: false });

    if (revenuesError) {
      console.error('❌ Erro ao buscar receitas:', revenuesError);
      return NextResponse.json({ 
        error: 'Erro ao buscar receitas',
        details: revenuesError.message 
      }, { status: 500 });
    }

    // Buscar transações parceladas do usuário (tipo receita)
    const { data: installmentTransactions, error: installmentError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', supabaseUserId)
      .eq('type', 'revenue')
      .eq('is_installment', true)
      .order('date', { ascending: false });

    if (installmentError) {
      console.error('❌ Erro ao buscar transações parceladas:', installmentError);
      return NextResponse.json({ 
        error: 'Erro ao buscar transações parceladas',
        details: installmentError.message 
      }, { status: 500 });
    }

    console.log(`✅ ${revenues?.length || 0} receitas regulares encontradas`);
    console.log(`✅ ${installmentTransactions?.length || 0} transações parceladas encontradas`);
    
    // Debug detalhado das receitas regulares
    if (revenues && revenues.length > 0) {
      revenues.forEach((revenue, index) => {
        console.log(`💰 Receita regular ${index + 1}:`, {
          id: revenue.id,
          description: revenue.description,
          amount: revenue.amount,
          category: revenue.category,
          source: revenue.source,
          date: revenue.date
        });
      });
    }

    // Debug detalhado das transações parceladas
    if (installmentTransactions && installmentTransactions.length > 0) {
      installmentTransactions.forEach((transaction, index) => {
        console.log(`💳 Transação parcelada ${index + 1}:`, {
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
          type: transaction.type,
          date: transaction.date,
          installment_info: transaction.installment_info
        });
      });
    }

    // Combinar receitas regulares e transações parceladas
    const allRevenues = [
      ...(revenues || []),
      ...(installmentTransactions || [])
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log(`🎯 Total de receitas (regulares + parceladas): ${allRevenues.length}`);

    return NextResponse.json({
      success: true,
      revenues: allRevenues || []
    });

  } catch (error) {
    console.error('❌ Erro geral ao buscar receitas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}