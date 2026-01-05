import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

// GET - Buscar metas pessoais do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    let query = supabase
      .from('personal_goals')
      .select('*')
      .eq('user_id', userId)
      .order('deadline', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: goals, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const goalsWithProgress = goals?.map(goal => {
      const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
      return {
        ...goal,
        progress_percentage: Math.min(progress, 100)
      };
    }) || [];

    return NextResponse.json({ goals: goalsWithProgress });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      user_id,
      title,
      description,
      target_amount,
      current_amount,
      category,
      priority,
      target_date,
      status,
      monthly_contribution,
      notes,
      type
    } = body;

    if (!id || !user_id) {
      return NextResponse.json(
        { error: 'ID da meta e ID do usuário são obrigatórios' },
        { status: 400 }
      );
    }
    if (process.env.NODE_ENV === 'production') {
      const origin = (request as any).headers?.get?.('origin') || ''
      const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const isAllowed = allowed.length ? allowed.includes(origin) : (appUrl ? origin.startsWith(appUrl) : true)
      if (!isAllowed) {
        return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
      }
    }
    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const updatePayload: Record<string, any> = {};

    if (title !== undefined) updatePayload.name = title;
    if (description !== undefined) updatePayload.description = description;
    if (typeof target_amount !== 'undefined') {
      const ta = parseFloat(String(target_amount));
      if (!Number.isNaN(ta)) updatePayload.target_amount = ta;
    }
    if (typeof current_amount !== 'undefined') {
      const ca = parseFloat(String(current_amount));
      if (!Number.isNaN(ca)) updatePayload.current_amount = ca;
    }
    if (priority !== undefined) updatePayload.priority = priority;
    if (status !== undefined) updatePayload.status = status;
    if (target_date !== undefined) updatePayload.deadline = target_date;
    const normalizeType = (v: any): string => {
      const s = String(v || '').toLowerCase();
      const map: Record<string, string> = {
        emergency_fund: 'emergency_fund',
        savings: 'savings',
        saving: 'savings',
        debt_payoff: 'debt_payoff',
        investment: 'investment',
        purchase: 'purchase',
        car: 'purchase',
        vacation: 'vacation',
        travel: 'vacation',
        retirement: 'retirement',
        education: 'education',
        home_purchase: 'home_purchase',
        house: 'home_purchase',
        wedding: 'wedding',
        gift: 'other',
        health: 'other',
        other: 'other'
      };
      return map[s] || 'other';
    };
    if (type !== undefined) updatePayload.type = normalizeType(type);
    if (category !== undefined) updatePayload.type = normalizeType(category);

    updatePayload.updated_at = new Date().toISOString();

    if (Object.keys(updatePayload).length === 1) { // apenas updated_at
      return NextResponse.json(
        { error: 'Nenhum campo válido para atualização foi fornecido' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('personal_goals')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao atualizar meta pessoal' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar meta pessoal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    if (!id || !userId) {
      return NextResponse.json(
        { success: false, error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }
    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin') || ''
      const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const isAllowed = allowed.length ? allowed.includes(origin) : (appUrl ? origin.startsWith(appUrl) : true)
      if (!isAllowed) {
        return NextResponse.json({ success: false, error: 'Origem não permitida' }, { status: 403 })
      }
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('personal_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erro ao deletar meta: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Meta pessoal deletada com sucesso'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova meta pessoal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, name, description, type, target_amount, deadline, priority, current_amount, monthly_contribution, notes } = body;

    if (!user_id || !name || !type || !target_amount || !deadline) {
      return NextResponse.json({ 
        error: 'user_id, name, type, target_amount e deadline são obrigatórios' 
      }, { status: 400 });
    }
    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin') || ''
      const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
      const isAllowed = allowed.length ? allowed.includes(origin) : (appUrl ? origin.startsWith(appUrl) : true)
      if (!isAllowed) {
        return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
      }
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const normalizeType = (v: any): string => {
      const s = String(v || '').toLowerCase();
      const map: Record<string, string> = {
        emergency_fund: 'emergency_fund',
        savings: 'savings',
        saving: 'savings',
        debt_payoff: 'debt_payoff',
        investment: 'investment',
        purchase: 'purchase',
        car: 'purchase',
        vacation: 'vacation',
        travel: 'vacation',
        retirement: 'retirement',
        education: 'education',
        home_purchase: 'home_purchase',
        house: 'home_purchase',
        wedding: 'wedding',
        gift: 'other',
        health: 'other',
        other: 'other'
      };
      return map[s] || 'other';
    };
    const normalizedType = normalizeType(type);
    const { data: goal, error } = await supabase
      .from('personal_goals')
      .insert({
        user_id,
        name,
        description,
        type: normalizedType,
        target_amount,
        current_amount: typeof current_amount !== 'undefined' 
          ? (Number.isFinite(parseFloat(String(current_amount))) ? parseFloat(String(current_amount)) : 0)
          : 0,
        deadline,
        priority: priority || 'medium',
        status: 'active',
        monthly_contribution: typeof monthly_contribution === 'number' ? monthly_contribution : (monthly_contribution ? parseFloat(String(monthly_contribution)) : null),
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ goal });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
