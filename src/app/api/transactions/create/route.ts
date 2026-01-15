import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminService } from '@/lib/supabase-service';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';
import { parseDateInput } from '@/lib/date-utils';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API route iniciada');
    
    const body = await request.json();
    console.log('📝 Body recebido:', JSON.stringify(body, null, 2));
    
    const { user_id, transaction } = body;
    
    console.log('📝 Criando transação:', { user_id, transaction });

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

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    const internalUserId = user.id

    // Preparar dados da transação para o SupabaseService
    const transactionData = {
      date: parseDateInput(transaction.date),
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
    const result = await supabaseAdminService.createTransaction(internalUserId, transactionData);

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
