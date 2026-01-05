import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function PUT(request: NextRequest) {
  try {
    console.log('📝 API route PUT iniciada');
    
    const body = await request.json();
    const { user_id: supabaseUserId, debt_id: debtId, debt } = body;

    console.log('📝 Atualizando dívida ID:', debtId, 'para Supabase User ID:', supabaseUserId);

    if (!supabaseUserId || !debtId || !debt) {
      console.log('❌ Dados obrigatórios não fornecidos');
      return NextResponse.json(
        { error: 'user_id, debt_id e debt são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== supabaseUserId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se a dívida existe e pertence ao usuário
    const { data: existingDebt, error: checkError } = await supabase
      .from('debts')
      .select('id, user_id')
      .eq('id', debtId)
      .eq('user_id', supabaseUserId)
      .single();

    if (checkError || !existingDebt) {
      console.log('❌ Dívida não encontrada ou não pertence ao usuário:', checkError);
      return NextResponse.json(
        { error: 'Dívida não encontrada ou você não tem permissão para editá-la' },
        { status: 404 }
      );
    }

    console.log('✅ Dívida encontrada e verificada:', existingDebt.id);

    // Converter dados do frontend para o formato do Supabase
    const debtData: any = {
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
    // Not storing in the debts table as JSONB

    // Atualizar dívida no Supabase
    const { data: updatedDebt, error: updateError } = await supabase
      .from('debts')
      .update(debtData)
      .eq('id', debtId)
      .eq('user_id', supabaseUserId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar dívida:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar dívida', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Dívida atualizada:', updatedDebt.id);

    // If debt status is being changed to paid and we have payment data, insert into debt_payments table
    if (debt.status === 'paid' && debt.payments && debt.payments.length > 0) {
      const latestPayment = debt.payments[debt.payments.length - 1];
      
      const paymentData = {
        debt_id: debtId,
        user_id: supabaseUserId,
        date: latestPayment.date || new Date().toISOString(),
        amount: latestPayment.amount || debt.currentAmount,
        payment_method: latestPayment.paymentMethod || debt.paymentMethod || 'pix',
        notes: latestPayment.notes || 'Pagamento registrado via sistema'
      };

      const { error: paymentError } = await supabase
        .from('debt_payments')
        .insert(paymentData);

      if (paymentError) {
        console.error('⚠️ Erro ao registrar pagamento (não crítico):', paymentError);
        // Don't fail the entire operation if payment logging fails
      } else {
        console.log('✅ Pagamento registrado na tabela debt_payments');
      }
    }

    // Fetch payments from debt_payments table
    const { data: debtPayments, error: paymentsError } = await supabase
      .from('debt_payments')
      .select('*')
      .eq('debt_id', debtId)
      .order('date', { ascending: false });

    if (paymentsError) {
      console.error('⚠️ Erro ao buscar pagamentos (não crítico):', paymentsError);
    }

    // Converter dados de volta para o formato do frontend
    const convertedDebt = {
      id: updatedDebt.id,
      creditorName: updatedDebt.creditor_name,
      description: updatedDebt.description,
      originalAmount: updatedDebt.original_amount,
      currentAmount: updatedDebt.current_amount,
      interestRate: updatedDebt.interest_rate,
      dueDate: new Date(updatedDebt.due_date),
      createdDate: new Date(updatedDebt.created_at),
      category: updatedDebt.category,
      priority: updatedDebt.priority,
      status: updatedDebt.status,
      paymentMethod: updatedDebt.payment_method,
      notes: updatedDebt.notes,
      tags: updatedDebt.tags || [],
      installments: updatedDebt.installments,
      payments: (debtPayments || []).map(payment => ({
        id: payment.id,
        debtId: payment.debt_id,
        date: new Date(payment.date),
        amount: payment.amount,
        paymentMethod: payment.payment_method,
        notes: payment.notes
      }))
    };

    return NextResponse.json({
      success: true,
      debt: convertedDebt,
      message: 'Dívida atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro detalhado na API de atualização de dívida:', {
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
