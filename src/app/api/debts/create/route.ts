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
    const { user_id: firebaseUid, debt } = body;

    console.log('💳 Criando dívida para Firebase UID:', firebaseUid);

    if (!firebaseUid || !debt) {
      console.log('❌ Dados obrigatórios não fornecidos');
      return NextResponse.json(
        { error: 'user_id e debt são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo firebase_uid
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (userError || !user) {
      console.log('❌ Usuário não encontrado:', userError);
      return NextResponse.json(
        { error: 'Usuário não encontrado no Supabase' },
        { status: 404 }
      );
    }

    console.log('✅ Usuário encontrado:', user.id);

    // Converter dados do frontend para o formato do Supabase
    const debtData: any = {
      user_id: user.id,
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
    if (debt.installments) {
      debtData.installments = debt.installments;
    }
    
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