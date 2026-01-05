import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient, createServiceClient } from '@/utils/supabase/server';
import { notifyProductSold } from '@/lib/n8n-events';

export async function POST(request: NextRequest) {
  const routeStart = Date.now()
  try {
    const revenueData = await request.json();
    const parseEnd = Date.now()
    const timings: Record<string, number> = { parse: parseEnd - routeStart }
    const supabase = await createSupabaseClient()
    const serviceSupabase = createServiceClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    let internalUserId = user.id
    const { data: byId } = await serviceSupabase
      .from('users')
      .select('id, email, firebase_uid, account_type, created_at')
      .eq('id', user.id)
      .single()
    let resolvedUserRow = byId || null
    if (!resolvedUserRow) {
      const { data: byFirebase } = await serviceSupabase
        .from('users')
        .select('id, email, firebase_uid, account_type, created_at')
        .eq('firebase_uid', user.id)
        .single()
      resolvedUserRow = byFirebase || null
    }
    if (!resolvedUserRow && user.email) {
      const { data: byEmail } = await serviceSupabase
        .from('users')
        .select('id, email, firebase_uid, account_type, created_at')
        .eq('email', user.email)
        .single()
      resolvedUserRow = byEmail || null
    }
    if (!resolvedUserRow) {
      const insertPayload: any = {
        id: user.id,
        firebase_uid: user.id,
        email: user.email || `${user.id}@local`,
        name: (user.user_metadata as any)?.name || null,
        avatar_url: (user.user_metadata as any)?.avatar_url || null,
        account_type: 'personal'
      }
      const { data: created } = await serviceSupabase
        .from('users')
        .insert(insertPayload)
        .select()
        .single()
      resolvedUserRow = created
    } else if (!resolvedUserRow.firebase_uid || resolvedUserRow.firebase_uid !== user.id) {
      const { data: updated } = await serviceSupabase
        .from('users')
        .update({ firebase_uid: user.id, updated_at: new Date().toISOString() })
        .eq('id', resolvedUserRow.id)
        .select()
        .single()
      resolvedUserRow = updated || resolvedUserRow
    }
    internalUserId = resolvedUserRow?.id || user.id
    
    console.log('💰 Criando receita via API:', revenueData);

    // Validar dados obrigatórios
    // userId garantido via sessão

    const userQueryStart = Date.now()
    const { data: userRow, error: userError } = await serviceSupabase
      .from('users')
      .select('account_type, created_at')
      .eq('id', internalUserId)
      .single()
    timings.userQuery = Date.now() - userQueryStart
    
    const resolvedUser = userError || !userRow
      ? { account_type: 'personal', created_at: new Date().toISOString() }
      : userRow

    if (resolvedUser?.account_type === 'basic') {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const startIso = start.toISOString()
      const endIso = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString()

      const planCountStart = Date.now()
      const { count, error: countError } = await serviceSupabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', internalUserId)
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
      user_id: internalUserId
    };

    console.log('📋 Dados processados da receita:', processedRevenueData);

    // 1. Primeiro criar a transação
    const transactionData = {
      user_id: internalUserId,
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

    // 3. Se for receita de venda vinculada a produto, registrar venda
    if (processedRevenueData.product_id && processedRevenueData.source === 'sale') {
      try {
        console.log('🛒 Receita vinculada a produto. Registrando venda...');
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name, category, selling_price, quantity, quantity_sold, status')
          .eq('id', processedRevenueData.product_id)
          .eq('user_id', internalUserId)
          .single();

        if (productError || !product) {
          console.warn('⚠️ Produto não encontrado para registrar venda:', productError);
        } else {
          const unitPrice = Number(product.selling_price) || Number(processedRevenueData.amount) || 0;
          let quantity = Math.round(Number(processedRevenueData.amount) / (unitPrice || 1));
          if (!quantity || quantity <= 0) quantity = 1;
          const totalAmount = unitPrice * quantity;

          console.log('🧮 Dados calculados da venda:', { unitPrice, quantity, totalAmount });

          const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert({
              user_id: internalUserId,
              product_id: product.id,
              quantity,
              unit_price: unitPrice,
              date: processedRevenueData.date.toISOString(),
              buyer_name: null,
              notes: processedRevenueData.notes || ''
            })
            .select()
            .single();

          if (saleError) {
            console.error('❌ Erro ao registrar venda vinculada à receita:', saleError);
          } else {
            console.log('✅ Venda registrada com sucesso:', sale.id);
            const currentSold = Number(product.quantity_sold || 0);
            const currentQty = Number(product.quantity || 0);
            const updatedSold = currentSold + quantity;
            const newStatus = updatedSold >= currentQty && currentQty > 0 ? 'sold' : (product.status || 'selling');

            await supabase
              .from('products')
              .update({ quantity_sold: updatedSold, status: newStatus })
              .eq('id', product.id)
              .eq('user_id', internalUserId);

            try {
              await notifyProductSold(internalUserId, product as any, {
                id: sale.id,
                quantity,
                date: processedRevenueData.date.toISOString(),
                buyerName: null
              });
            } catch (_) {
              // notificar é opcional
            }
          }
        }
      } catch (err) {
        console.error('❌ Erro ao processar venda vinculada à receita:', err);
      }
    }

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
