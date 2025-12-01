import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Buscar configurações de salário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const { data: settings, error } = await supabase
      .from('personal_salary_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao buscar configurações de salário:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    return NextResponse.json({ settings: settings || null });
  } catch (error) {
    console.error('Erro na API de configurações de salário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar ou atualizar configurações de salário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      amount,
      description,
      payment_day,
      is_active,
      is_taxable,
      tax_withheld,
      source,
      notes
    } = body;

    // Validações
    if (!user_id || !amount || !description || !payment_day || !source) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: user_id, amount, description, payment_day, source' 
      }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'O valor deve ser maior que zero' }, { status: 400 });
    }

    if (payment_day < 1 || payment_day > 31) {
      return NextResponse.json({ error: 'Dia de pagamento deve estar entre 1 e 31' }, { status: 400 });
    }

    // Bloqueio para plano gratuito após 3 dias
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUsers = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: userRow } = await supabaseUsers
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

    // Verificar se já existe configuração para este usuário
    const { data: existingSettings } = await supabase
      .from('personal_salary_settings')
      .select('id')
      .eq('user_id', user_id)
      .single();

    const settingsData = {
      user_id,
      amount: parseFloat(amount),
      description,
      payment_day: parseInt(payment_day),
      is_active: Boolean(is_active),
      is_taxable: Boolean(is_taxable),
      tax_withheld: parseFloat(tax_withheld) || 0,
      source,
      notes: notes || null,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingSettings) {
      // Atualizar configuração existente
      const { data, error } = await supabase
        .from('personal_salary_settings')
        .update(settingsData)
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar configurações de salário:', error);
        return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
      }
      result = data;
    } else {
      // Criar nova configuração
      settingsData.created_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('personal_salary_settings')
        .insert([settingsData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar configurações de salário:', error);
        return NextResponse.json({ error: 'Erro ao criar configurações' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ 
      message: 'Configurações salvas com sucesso',
      settings: result
    });
  } catch (error) {
    console.error('Erro na API de configurações de salário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Remover configurações de salário
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const { error } = await supabase
      .from('personal_salary_settings')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao remover configurações de salário:', error);
      return NextResponse.json({ error: 'Erro ao remover configurações' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Configurações removidas com sucesso' });
  } catch (error) {
    console.error('Erro na API de configurações de salário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
