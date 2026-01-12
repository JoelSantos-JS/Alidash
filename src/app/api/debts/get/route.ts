import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('user_id');

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (requestedUserId && requestedUserId !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const userId = user.id;

    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (debtsError) {
      return NextResponse.json(
        { error: 'Erro ao buscar dívidas' },
        { status: 500 }
      );
    }

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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
