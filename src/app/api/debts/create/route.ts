import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase para evitar problemas de inicialização
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API route POST iniciada');
    
    const body = await request.json();
    const { user_id: supabaseUserId, debt } = body;

    console.log('💳 Criando dívida para Supabase User ID:', supabaseUserId);

    if (!supabaseUserId || !debt) {
      console.log('❌ Dados obrigatórios não fornecidos');
      return NextResponse.json(
        { error: 'user_id e debt são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: userRow } = await supabase
      .from('users')
      .select('account_type, created_at, plan_started_at')
      .eq('id', supabaseUserId)
      .single()
    const isPaid = userRow?.account_type === 'pro' || userRow?.account_type === 'basic'
    if (!isPaid) {
      const startAt = userRow?.plan_started_at ? new Date(userRow.plan_started_at) : (userRow?.created_at ? new Date(userRow.created_at) : new Date())
      const diffDays = Math.floor((Date.now() - startAt.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 5) {
        return NextResponse.json({ error: 'Período gratuito de 5 dias expirado' }, { status: 403 })
      }
    }

    // Converter dados do frontend para o formato do Supabase
    const debtData: any = {
      user_id: supabaseUserId,
      creditor_name: debt.creditorName,
      description: debt.description,
      original_amount: debt.originalAmount,
      current_amount: debt.currentAmount,
      interest_rate: debt.interestRate,
      due_date: debt.dueDate,
      category: debt.category,
      priority: debt.priority,
      status: debt.status,
      payment_method: debt.paymentMethod,
      notes: debt.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Adicionar campos opcionais apenas se existirem na tabela
    if (debt.tags) {
      debtData.tags = debt.tags;
    }
    // Temporariamente removido installments devido a problema de cache do schema
    // if (debt.installments) {
    //   debtData.installments = debt.installments;
    // }
    
    // Note: payments are handled separately in debt_payments table

    // Inserir dívida no Supabase
    const { data: newDebt, error: createError } = await supabase
      .from('debts')
      .insert(debtData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar dívida:', createError);
      return NextResponse.json(
        { error: 'Erro ao criar dívida', details: createError.message },
        { status: 500 }
      );
    }

    console.log('✅ Dívida criada:', newDebt.id);

    // Converter dados de volta para o formato do frontend
    const convertedDebt = {
      id: newDebt.id,
      creditorName: newDebt.creditor_name,
      description: newDebt.description,
      originalAmount: newDebt.original_amount,
      currentAmount: newDebt.current_amount,
      interestRate: newDebt.interest_rate,
      dueDate: new Date(newDebt.due_date),
      createdDate: new Date(newDebt.created_at),
      category: newDebt.category,
      priority: newDebt.priority,
      status: newDebt.status,
      paymentMethod: newDebt.payment_method,
      notes: newDebt.notes,
      tags: newDebt.tags || [],
      installments: newDebt.installments,
      payments: [] // New debts have no payments yet
    };

    return NextResponse.json({
      success: true,
      debt: convertedDebt,
      message: 'Dívida criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro detalhado na API de criação de dívida:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
