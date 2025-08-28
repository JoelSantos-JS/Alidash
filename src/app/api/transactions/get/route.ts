import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminService } from '@/lib/supabase-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type') as 'revenue' | 'expense' | null;
    const category = searchParams.get('category');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando transações no Supabase:', {
      userId,
      type,
      category,
      startDate,
      endDate
    });

    const transactions = await supabaseAdminService.getTransactions(userId, {
      type: type || undefined,
      category: category || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    console.log('✅ Transações encontradas:', transactions?.length || 0);

    return NextResponse.json({
      transactions: transactions || [],
      count: transactions?.length || 0
    });

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 