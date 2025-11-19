import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  const routeStart = Date.now()
  try {
    const revenueData = await request.json();
    const parseEnd = Date.now()
    const timings: Record<string, number> = { parse: parseEnd - routeStart }
    const userId = revenueData.user_id
    
    console.log('💰 Criando receita via API:', revenueData);

    // Validar dados obrigatórios
    if (!userId) {
      return NextResponse.json({ 
        error: 'user_id é obrigatório' 
      }, { status: 400 });
    }

    const userQueryStart = Date.now()
    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', userId)
      .single()
    timings.userQuery = Date.now() - userQueryStart

    if (userError) {
      return NextResponse.json({ error: 'Erro ao validar usuário' }, { status: 500 })
    }

    if (userRow?.account_type === 'basic') {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const startIso = start.toISOString()
      const endIso = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString()

      const planCountStart = Date.now()
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('date', startIso)
        .lte('date', endIso)
      timings.planCount = Date.now() - planCountStart

      if (countError) {
        return NextResponse.json({ error: 'Erro ao validar limite do plano' }, { status: 500 })
      }

      if ((count ?? 0) >= 1000) {
        return NextResponse.json({ error: 'Limite mensal de transações do plano Básico atingido' }, { status: 403 })
      }
    }

    if (!revenueData.description) {
      return NextResponse.json({ 
        error: 'description é obrigatória' 
      }, { status: 400 });
    }

    if (!revenueData.amount || revenueData.amount <= 0) {
      return NextResponse.json({ 
        error: 'amount deve ser maior que zero' 
      }, { status: 400 });
    }

    if (!revenueData.category) {
      return NextResponse.json({ 
        error: 'category é obrigatória' 
      }, { status: 400 });
    }

    if (!revenueData.source) {
      return NextResponse.json({ 
        error: 'source é obrigatória' 
      }, { status: 400 });
    }

    // Converter date string para Date object se necessário
    const processedRevenueData = {
      description: revenueData.description,
      amount: parseFloat(revenueData.amount),
      category: revenueData.category,
      source: revenueData.source,
      notes: revenueData.notes || '',
      product_id: revenueData.product_id || null,
      date: typeof revenueData.date === 'string' ? new Date(revenueData.date) : new Date(revenueData.date),
      user_id: userId
    };

    console.log('📋 Dados processados da receita:', processedRevenueData);

    // 1. Primeiro criar a transação
    const transactionData = {
      user_id: userId,
      date: processedRevenueData.date,
      description: processedRevenueData.description,
      amount: processedRevenueData.amount,
      type: 'revenue',
      category: processedRevenueData.category,
      subcategory: null,
      payment_method: 'pix',
      status: 'completed',
      notes: processedRevenueData.notes || null,
      tags: [],
      is_installment: false,
      installment_info: null
    };

    console.log('🔄 Criando transação para receita:', transactionData);

    const txInsertStart = Date.now()
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
    timings.txInsert = Date.now() - txInsertStart

    if (transactionError) {
      console.error('❌ Erro ao criar transação:', transactionError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao criar transação'
      }, { status: 500 });
    }

    console.log('✅ Transação criada com sucesso:', transaction.id);

    // 2. Agora criar a receita com referência à transação
    const revenueWithTransaction = {
      ...processedRevenueData,
      transaction_id: transaction.id
    };

    const revInsertStart = Date.now()
    const { data: revenue, error } = await supabase
      .from('revenues')
      .insert(revenueWithTransaction)
      .select()
      .single();
    timings.revInsert = Date.now() - revInsertStart

    if (error) {
      console.error('❌ Erro ao criar receita:', error);
      
      // Se falhar ao criar a receita, remover a transação criada
      await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      return NextResponse.json({
        success: false,
        error: 'Erro ao criar receita'
      }, { status: 500 });
    }

    console.log('✅ Receita criada com sucesso:', revenue);

    // Retornar a receita criada
    const total = Date.now() - routeStart
    const serverTiming = Object.entries({ ...timings, total }).map(([k, v]) => `${k};dur=${Math.round(v)}`).join(', ')
    return NextResponse.json({ success: true, revenue, transaction }, { headers: { 'Server-Timing': serverTiming } })

  } catch (error) {
    console.error('❌ Erro ao criar receita:', error);
    
    const total = Date.now() - routeStart
    const serverTiming = `total;dur=${Math.round(total)}`
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500, headers: { 'Server-Timing': serverTiming } })
  }
}