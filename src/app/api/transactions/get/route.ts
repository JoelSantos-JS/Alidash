import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/utils/supabase/server';

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
    const userIdParam = searchParams.get('user_id');
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    console.log('🔍 Buscando transações para usuário:', userIdParam);

    if (!userIdParam) {
      console.log('❌ user_id não fornecido');
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    const svc = createServiceClient()
    let internalUserId = userIdParam
    const { data: byId } = await svc
      .from('users')
      .select('id')
      .eq('id', userIdParam)
      .single()
    if (byId?.id) {
      internalUserId = byId.id
    } else {
      const { data: byFirebase } = await svc
        .from('users')
        .select('id')
        .eq('firebase_uid', userIdParam)
        .single()
      if (byFirebase?.id) internalUserId = byFirebase.id
    }

    // Montar query com filtros opcionais de data
    console.log('🔧 Executando query com filtros de data...');
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', internalUserId);

    if (startDateParam) {
      const startDate = new Date(startDateParam);
      if (!isNaN(startDate.getTime())) {
        query = query.gte('date', startDate.toISOString());
      }
    }

    if (endDateParam) {
      const endDate = new Date(endDateParam);
      if (!isNaN(endDate.getTime())) {
        query = query.lte('date', endDate.toISOString());
      }
    }

    query = query.order('date', { ascending: false });

    const { data: transactions, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar transações:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar transações', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Query executada com sucesso, transações encontradas:', transactions?.length || 0);

    // Converter transações de forma mais simples
    const convertedTransactions = transactions?.map((transaction: any) => ({
      id: transaction.id,
      date: new Date(transaction.date),
      description: transaction.description,
      amount: parseFloat(transaction.amount) || 0,
      type: transaction.type,
      category: transaction.category,
      subcategory: transaction.subcategory,
      paymentMethod: transaction.payment_method,
      status: transaction.status,
      notes: transaction.notes,
      tags: transaction.tags || [],
      productId: transaction.product_id,
      isInstallment: Boolean(transaction.is_installment),
      installmentInfo: transaction.installment_info
    })) || [];

    console.log('✅ Transações convertidas:', convertedTransactions.length);

    return NextResponse.json({
      transactions: convertedTransactions,
      count: convertedTransactions.length
    });

  } catch (error) {
    console.error('❌ Erro detalhado na API de transações:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
      timestamp: new Date().toISOString()
    });
    
    // Retornar erro mais específico
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
