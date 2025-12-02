import { NextRequest, NextResponse } from 'next/server';
import { applyUserFixedSalary, applyFixedSalaries } from '@/lib/salary-automation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, month, year, apply_all } = body;

    // Validações básicas
    if (!month || !year) {
      return NextResponse.json(
        { error: 'Mês e ano são obrigatórios' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Mês deve estar entre 1 e 12' },
        { status: 400 }
      );
    }

    if (year < 2020 || year > 2030) {
      return NextResponse.json(
        { error: 'Ano deve estar entre 2020 e 2030' },
        { status: 400 }
      );
    }

    let result;

    if (apply_all) {
      // Aplicar para todos os usuários
      result = await applyFixedSalaries(month, year);
    } else {
      // Aplicar para usuário específico
      if (!user_id) {
        return NextResponse.json(
          { error: 'user_id é obrigatório quando apply_all não está definido' },
          { status: 400 }
        );
      }

      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: userRow } = await supabase
        .from('users')
        .select('account_type, created_at, plan_started_at')
        .eq('id', user_id)
        .single()
      const isPaid = userRow?.account_type === 'pro' || userRow?.account_type === 'basic'
      if (!isPaid) {
        const startAt = userRow?.plan_started_at ? new Date(userRow.plan_started_at) : (userRow?.created_at ? new Date(userRow.created_at) : new Date())
        const diffDays = Math.floor((Date.now() - startAt.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays >= 3) {
          return NextResponse.json({ error: 'Período gratuito de 3 dias expirado' }, { status: 403 })
        }
      }

      result = await applyUserFixedSalary(user_id, month, year);
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result,
        message: result.message || 'Salário aplicado com sucesso'
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          message: 'Erro ao aplicar salário'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Erro na API de automação de salário:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const month = parseInt(searchParams.get('month') || '');
    const year = parseInt(searchParams.get('year') || '');

    if (!user_id || !month || !year) {
      return NextResponse.json(
        { error: 'user_id, month e year são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o salário já foi aplicado para este mês
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const { data: existingIncome, error } = await supabase
      .from('personal_incomes')
      .select('id, description, amount, date')
      .eq('user_id', user_id)
      .eq('category', 'salary')
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfMonth.toISOString().split('T')[0]);

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao verificar salário existente' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      has_salary: existingIncome && existingIncome.length > 0,
      salary_data: existingIncome || null
    });

  } catch (error) {
    console.error('❌ Erro na verificação de salário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
