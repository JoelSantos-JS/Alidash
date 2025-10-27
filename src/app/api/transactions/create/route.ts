import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminService } from '@/lib/supabase-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API route iniciada');
    
    const body = await request.json();
    console.log('📝 Body recebido:', JSON.stringify(body, null, 2));
    
    const { user_id, transaction } = body;
    
    console.log('📝 Criando transação:', {
      user_id,
      transaction: {
        ...transaction,
        isInstallment: transaction.isInstallment,
        installmentInfo: transaction.installmentInfo
      }
    });

    if (!user_id) {
      console.error('❌ user_id não fornecido');
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    if (!transaction) {
      console.error('❌ transaction não fornecido');
      return NextResponse.json(
        { error: 'transaction é obrigatório' },
        { status: 400 }
      );
    }

    // Preparar dados da transação para o SupabaseService
    const transactionData = {
      date: transaction.date instanceof Date ? transaction.date : new Date(transaction.date),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      subcategory: transaction.subcategory,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      notes: transaction.notes,
      tags: transaction.tags || [],
      isInstallment: transaction.isInstallment || false,
      installmentInfo: transaction.installmentInfo || null
    };

    console.log('🔧 Criando transação usando SupabaseService...');
    
    // Usar o método createTransaction do SupabaseService que tem a lógica de criação automática
    const result = await supabaseAdminService.createTransaction(user_id, transactionData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Erro ao criar transação:', error);
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    });
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}