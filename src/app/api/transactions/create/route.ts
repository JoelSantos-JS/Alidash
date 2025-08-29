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

    // Verificar se é uma transação parcelada
    if (transaction.isInstallment && transaction.installmentInfo) {
      console.log('🎯 Transação parcelada detectada na API:', {
        isInstallment: transaction.isInstallment,
        installmentInfo: transaction.installmentInfo,
        installmentInfo_keys: Object.keys(transaction.installmentInfo),
        has_totalAmount: 'totalAmount' in transaction.installmentInfo,
        has_nextDueDate: 'nextDueDate' in transaction.installmentInfo,
        totalAmount: transaction.installmentInfo.totalAmount,
        totalInstallments: transaction.installmentInfo.totalInstallments,
        currentInstallment: transaction.installmentInfo.currentInstallment
      });
    } else if (transaction.isInstallment && !transaction.installmentInfo) {
      console.log('⚠️ ATENÇÃO: Transação marcada como parcelada mas sem installmentInfo!');
    }

    // Preparar dados para inserção
    const insertData = {
      user_id: user_id,
      date: transaction.date instanceof Date ? transaction.date.toISOString() : new Date(transaction.date).toISOString(),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      subcategory: transaction.subcategory,
      payment_method: transaction.paymentMethod,
      status: transaction.status,
      notes: transaction.notes,
      tags: transaction.tags,
      // Campos para compras parceladas
      is_installment: transaction.isInstallment || false,
      installment_info: transaction.installmentInfo ? JSON.stringify(transaction.installmentInfo) : null
    };

    console.log('📝 Dados para inserção:', {
      is_installment: insertData.is_installment,
      installment_info: insertData.installment_info,
      installment_info_parsed: insertData.installment_info ? JSON.parse(insertData.installment_info) : null
    });

    console.log('🔧 Inserindo no Supabase...');
    const { data, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar transação no Supabase:', error);
      return NextResponse.json(
        { error: 'Erro ao criar transação no banco de dados', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Transação criada com sucesso:', {
      id: data.id,
      description: data.description,
      is_installment: data.is_installment,
      installment_info: data.installment_info
    });

    // Converter para formato de resposta
    const result = {
      id: data.id,
      date: new Date(data.date),
      description: data.description,
      amount: parseFloat(data.amount) || 0,
      type: data.type,
      category: data.category,
      subcategory: data.subcategory,
      paymentMethod: data.payment_method,
      status: data.status,
      notes: data.notes,
      tags: data.tags || [],
      productId: data.product_id,
      isInstallment: Boolean(data.is_installment),
      installmentInfo: data.installment_info ? JSON.parse(data.installment_info) : null
    };

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