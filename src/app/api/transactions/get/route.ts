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
    const userId = searchParams.get('user_id');

    console.log('🔍 Buscando transações para usuário:', userId);

    if (!userId) {
      console.log('❌ user_id não fornecido');
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    // Query simples para testar
    console.log('🔧 Executando query simples...');
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

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