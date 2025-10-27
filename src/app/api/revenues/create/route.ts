import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const revenueData = await request.json();
    
    console.log('💰 Criando receita via API:', revenueData);

    // Validar dados obrigatórios
    if (!revenueData.user_id) {
      return NextResponse.json({ 
        error: 'user_id é obrigatório' 
      }, { status: 400 });
    }

    if (!revenueData.description) {
      return NextResponse.json({ 
        error: 'description é obrigatória' 
      }, { status: 400 });
    }

    if (!revenueData.amount || revenueData.amount <= 0) {
      return NextResponse.json({ 
        error: 'amount deve ser maior que zero' 
      }, { status: 400 });
    }

    if (!revenueData.category) {
      return NextResponse.json({ 
        error: 'category é obrigatória' 
      }, { status: 400 });
    }

    if (!revenueData.source) {
      return NextResponse.json({ 
        error: 'source é obrigatória' 
      }, { status: 400 });
    }

    // Converter date string para Date object se necessário
    const processedRevenueData = {
      description: revenueData.description,
      amount: parseFloat(revenueData.amount),
      category: revenueData.category,
      source: revenueData.source,
      notes: revenueData.notes || '',
      product_id: revenueData.product_id || null,
      date: typeof revenueData.date === 'string' ? new Date(revenueData.date) : new Date(revenueData.date),
      user_id: revenueData.user_id
    };

    console.log('📋 Dados processados da receita:', processedRevenueData);

    // 1. Primeiro criar a transação
    const transactionData = {
      user_id: revenueData.user_id,
      date: processedRevenueData.date,
      description: processedRevenueData.description,
      amount: processedRevenueData.amount,
      type: 'revenue',
      category: processedRevenueData.category,
      subcategory: null,
      payment_method: 'pix',
      status: 'completed',
      notes: processedRevenueData.notes || null,
      tags: [],
      is_installment: false,
      installment_info: null
    };

    console.log('🔄 Criando transação para receita:', transactionData);

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error('❌ Erro ao criar transação:', transactionError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar transação'
      }, { status: 500 });
    }

    console.log('✅ Transação criada com sucesso:', transaction.id);

    // 2. Agora criar a receita com referência à transação
    const revenueWithTransaction = {
      ...processedRevenueData,
      transaction_id: transaction.id
    };

    const { data: revenue, error } = await supabase
      .from('revenues')
      .insert(revenueWithTransaction)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar receita:', error);
      
      // Se falhar ao criar a receita, remover a transação criada
      await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      return NextResponse.json({
        success: false,
        error: 'Erro ao criar receita'
      }, { status: 500 });
    }

    console.log('✅ Receita criada com sucesso:', revenue);

    // Retornar a receita criada
    return NextResponse.json({
      success: true,
      revenue,
      transaction
    });

  } catch (error) {
    console.error('❌ Erro ao criar receita:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
}