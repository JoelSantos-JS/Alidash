import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log('🔍 Buscando vendas para usuário ID:', userId);

    // Verificar se é um UUID (Supabase ID) ou Firebase UID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    let user;
    if (isUUID) {
      // É um UUID do Supabase, usar diretamente
      console.log('📋 Usando UUID do Supabase diretamente:', userId);
      user = { id: userId };
    } else {
      // É um Firebase UID, buscar usuário pelo firebase_uid
      console.log('🔍 Buscando usuário pelo Firebase UID:', userId);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', userId)
        .single();
      
      if (userError || !userData) {
        console.log('❌ Usuário não encontrado:', userError);
        return NextResponse.json({ 
          success: true, 
          sales: [],
          count: 0,
          message: 'Usuário não encontrado no Supabase'
        });
      }
      
      user = userData;
    }

    console.log('✅ Usuário encontrado:', user.id);

    // Buscar vendas do usuário com informações do produto
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        *,
        products!inner(
          id,
          name,
          category,
          selling_price
        )
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (salesError) {
      console.error('❌ Erro ao buscar vendas:', salesError);
      return NextResponse.json({ 
        error: 'Erro ao buscar vendas',
        details: salesError.message 
      }, { status: 500 });
    }

    console.log('🛒 Vendas encontradas:', sales?.length || 0);

    // Transformar dados do Supabase para o formato esperado
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
    console.error('❌ Erro na API de vendas:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}