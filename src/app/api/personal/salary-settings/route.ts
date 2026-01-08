import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient, createServiceClient } from '@/utils/supabase/server';

// GET - Buscar configurações de salário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
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
    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin') || ''
      const normalize = (u: string) => u.replace(/\/+$/, '')
      const allowed = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => normalize(s.trim()))
        .filter(Boolean)
      const appUrl = normalize((process.env.NEXT_PUBLIC_APP_URL || '').trim())
      const current = normalize(origin)
      const isAllowed = allowed.length ? allowed.includes(current) : (appUrl ? current === appUrl : true)
      if (!isAllowed) {
        return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
      }
    }
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

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se já existe configuração para este usuário
    const { data: existingSettings } = await supabase
      .from('personal_salary_settings')
      .select('id')
      .eq('user_id', user_id)
      .single();

    const settingsData = {
      user_id,
      amount: typeof amount === 'number' ? amount : parseFloat(String(amount)),
      description,
      payment_day: typeof payment_day === 'number' ? payment_day : parseInt(String(payment_day)),
      is_active: typeof is_active === 'boolean' ? is_active : String(is_active).toLowerCase() === 'true',
      is_taxable: typeof is_taxable === 'boolean' ? is_taxable : String(is_taxable).toLowerCase() === 'true',
      tax_withheld: typeof tax_withheld === 'number' ? tax_withheld : (parseFloat(String(tax_withheld)) || 0),
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
      const insertData = { ...settingsData, created_at: new Date().toISOString() };
      const { data, error } = await supabase
        .from('personal_salary_settings')
        .insert([insertData])
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
    if (process.env.NODE_ENV === 'production') {
      const origin = request.headers.get('origin') || ''
      const normalize = (u: string) => u.replace(/\/+$/, '')
      const allowed = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(s => normalize(s.trim()))
        .filter(Boolean)
      const appUrl = normalize((process.env.NEXT_PUBLIC_APP_URL || '').trim())
      const current = normalize(origin)
      const isAllowed = allowed.length ? allowed.includes(current) : (appUrl ? current === appUrl : true)
      if (!isAllowed) {
        return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
      }
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 });
    }

    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
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
