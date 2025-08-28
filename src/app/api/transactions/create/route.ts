import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminService } from '@/lib/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const { user_id, transaction } = await request.json();

    if (!user_id || !transaction) {
      return NextResponse.json(
        { error: 'user_id e transaction são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('💰 Criando transação no Supabase:', {
      user_id,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type
    });

    const createdTransaction = await supabaseAdminService.createTransaction(user_id, {
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      subcategory: transaction.subcategory,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      notes: transaction.notes,
      tags: transaction.tags,
      isInstallment: transaction.isInstallment,
      installmentInfo: transaction.installmentInfo
    });

    console.log('✅ Transação criada com sucesso:', createdTransaction.id);

    return NextResponse.json({
      success: true,
      transaction: createdTransaction
    });

  } catch (error) {
    console.error('❌ Erro ao criar transação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 