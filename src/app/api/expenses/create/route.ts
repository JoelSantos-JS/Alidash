import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const expenseData = await request.json();

    console.log('💰 Criando despesa via API:', { userId, expenseData });

    // Converter date string para Date object se necessário
    const processedExpenseData = {
      ...expenseData,
      user_id: userId,
      date: typeof expenseData.date === 'string' ? new Date(expenseData.date) : expenseData.date
    };

    // 1. Primeiro criar a transação
    const transactionData = {
      user_id: userId,
      date: processedExpenseData.date,
      description: processedExpenseData.description,
      amount: processedExpenseData.amount,
      type: 'expense',
      category: processedExpenseData.category || 'Despesas Gerais',
      subcategory: processedExpenseData.subcategory || null,
      payment_method: processedExpenseData.payment_method || 'pix', // Usar 'pix' como padrão em vez de 'other'
      status: 'completed',
      notes: processedExpenseData.notes || null,
      tags: [],
      is_installment: false,
      installment_info: null
    };

    console.log('🔄 Criando transação para despesa:', transactionData);

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

    // 2. Agora criar a despesa com referência à transação
    const expenseWithTransaction = {
      ...processedExpenseData,
      transaction_id: transaction.id
    };

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert(expenseWithTransaction)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar despesa no Supabase:', error);
      
      // Se falhar ao criar a despesa, remover a transação criada
      await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      return NextResponse.json({
        success: false,
        error: 'Erro ao criar despesa'
      }, { status: 500 });
    }

    console.log('✅ Despesa criada com sucesso:', expense);

    return NextResponse.json({
      success: true,
      expense,
      transaction
    });

  } catch (error) {
    console.error('❌ Erro ao criar despesa:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
}