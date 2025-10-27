import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase para evitar problemas de inicialização
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API route GET iniciada');
    
    const { searchParams } = new URL(request.url);
    const supabaseUserId = searchParams.get('user_id');

    console.log('🔍 Buscando dívidas para Supabase User ID:', supabaseUserId);

    if (!supabaseUserId) {
      console.log('❌ user_id não fornecido');
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dívidas do usuário diretamente
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', supabaseUserId)
      .order('created_at', { ascending: false });

    if (debtsError) {
      console.error('❌ Erro ao buscar dívidas:', debtsError);
      return NextResponse.json(
        { error: 'Erro ao buscar dívidas', details: debtsError.message },
        { status: 500 }
      );
    }

    console.log('✅ Dívidas encontradas:', debts?.length || 0);

    // Fetch payments for all debts
    let allPayments = [];
    if (debts && debts.length > 0) {
      const debtIds = debts.map(debt => debt.id);
      const { data: payments, error: paymentsError } = await supabase
        .from('debt_payments')
        .select('*')
        .in('debt_id', debtIds)
        .order('date', { ascending: false });

      if (paymentsError) {
        console.error('⚠️ Erro ao buscar pagamentos (não crítico):', paymentsError);
        allPayments = [];
      } else {
        allPayments = payments || [];
      }
    }

    // Converter dados do Supabase para o formato esperado pelo frontend
    const convertedDebts = (debts || []).map(debt => {
      const debtPayments = allPayments.filter(payment => payment.debt_id === debt.id);
      
      return {
        id: debt.id,
        creditorName: debt.creditor_name,
        description: debt.description,
        originalAmount: debt.original_amount,
        currentAmount: debt.current_amount,
        interestRate: debt.interest_rate,
        dueDate: new Date(debt.due_date),
        createdDate: new Date(debt.created_at),
        category: debt.category,
        priority: debt.priority,
        status: debt.status,
        paymentMethod: debt.payment_method,
        notes: debt.notes,
        tags: debt.tags || [],
        installments: debt.installments ? {
          total: debt.installments.total,
          paid: debt.installments.paid,
          amount: debt.installments.amount
        } : undefined,
        payments: debtPayments.map(payment => ({
          id: payment.id,
          debtId: payment.debt_id,
          date: new Date(payment.date),
          amount: payment.amount,
          paymentMethod: payment.payment_method,
          notes: payment.notes
        }))
      };
    });

    return NextResponse.json({
      success: true,
      debts: convertedDebts
    });

  } catch (error) {
    console.error('❌ Erro detalhado na API de dívidas:', {
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