import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        *,
        products(
          id,
          name,
          category,
          selling_price
        )
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (salesError) {
      return NextResponse.json({ 
        error: 'Erro ao buscar vendas',
        details: salesError.message 
      }, { status: 500 });
    }

    const transformedSales = sales?.map(sale => ({
      id: sale.id,
      productId: sale.product_id,
      productName: sale.products?.name || 'Produto não encontrado',
      buyerName: sale.buyer_name,
      quantity: sale.quantity,
      unitPrice: sale.unit_price,
      totalAmount: sale.total_amount,
      date: new Date(sale.date),
      createdAt: new Date(sale.created_at)
    })) || [];

    return NextResponse.json({ 
      success: true, 
      sales: transformedSales,
      count: transformedSales.length 
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
