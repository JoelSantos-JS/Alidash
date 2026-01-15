import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient, createServiceClient } from '@/utils/supabase/server';
import { normalizeDateForLocalDay } from '@/lib/date-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    const supabaseAuth = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (userIdParam && userIdParam !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const serviceSupabase = createServiceClient()
    let internalUserId = user.id
    const { data: byId } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()
    if (byId?.id) {
      internalUserId = byId.id
    } else {
      const { data: byFirebase } = await serviceSupabase
        .from('users')
        .select('id')
        .eq('firebase_uid', user.id)
        .single()
      if (byFirebase?.id) internalUserId = byFirebase.id
    }

    let query = serviceSupabase
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
      return NextResponse.json(
        { error: 'Erro ao buscar transações' },
        { status: 500 }
      );
    }

    // Converter transações de forma mais simples
    const convertedTransactions = transactions?.map((transaction: any) => ({
      id: transaction.id,
      date: normalizeDateForLocalDay(transaction.date),
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

    return NextResponse.json({
      transactions: convertedTransactions,
      count: convertedTransactions.length
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
