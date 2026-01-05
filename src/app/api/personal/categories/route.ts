import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

// Tipos baseados no arquivo SQL
type PersonalIncomeCategory = 
  | 'salary' | 'freelance' | 'investment' | 'rental' | 'bonus' 
  | 'gift' | 'pension' | 'benefit' | 'other';

type PersonalExpenseCategory = 
  | 'housing' | 'food' | 'transportation' | 'healthcare' | 'education' 
  | 'entertainment' | 'clothing' | 'utilities' | 'insurance' | 'personal_care' 
  | 'gifts' | 'pets' | 'charity' | 'taxes' | 'debt_payment' | 'savings' | 'other';

interface PersonalCategoryData {
  name: string;
  type: 'income' | 'expense';
  category: PersonalIncomeCategory | PersonalExpenseCategory;
  description?: string;
  color: string;
  icon: string;
  is_essential?: boolean;
  is_active?: boolean;
  budget_limit?: number;
}

const INCOME_CATEGORIES: PersonalIncomeCategory[] = [
  'salary','freelance','investment','rental','bonus','gift','pension','benefit','other'
]
const EXPENSE_CATEGORIES: PersonalExpenseCategory[] = [
  'housing','food','transportation','healthcare','education','entertainment','clothing','utilities','insurance','personal_care','gifts','pets','charity','taxes','debt_payment','savings','other'
]
function isHexColor(v: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)
}
function normalizeType(v: any): 'income' | 'expense' | null {
  if (v === 'income' || v === 'expense') return v
  if (v === 'revenue') return 'income'
  return null
}
function parseBoolean(v: any, defaultValue: boolean): boolean {
  if (typeof v === 'boolean') return v
  if (v === undefined || v === null) return defaultValue
  const s = String(v).toLowerCase()
  if (s === 'true') return true
  if (s === 'false') return false
  return defaultValue
}

// GET - Buscar categorias personalizadas do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const includeInactive = String(searchParams.get('include_inactive')).toLowerCase() === 'true';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    let query = supabase
      .from('personal_categories')
      .select('*')
      .eq('user_id', userId)
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erro ao buscar categorias: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      categories: data || []
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova categoria personalizada
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, ...categoryData }: { user_id: string } & PersonalCategoryData = body;

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    // Sistema totalmente pago: sem bloqueio por período gratuito

    if (!categoryData.name || !categoryData.type || !categoryData.category || !categoryData.color || !categoryData.icon) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: name, type, category, color, icon' },
        { status: 400 }
      );
    }

    const normalizedType = normalizeType(categoryData.type)
    if (!normalizedType) {
      return NextResponse.json(
        { success: false, error: 'type inválido' },
        { status: 400 }
      )
    }
    const nameTrimmed = String(categoryData.name).trim()
    if (!nameTrimmed) {
      return NextResponse.json(
        { success: false, error: 'name inválido' },
        { status: 400 }
      )
    }
    if (!isHexColor(String(categoryData.color))) {
      return NextResponse.json(
        { success: false, error: 'color inválido' },
        { status: 400 }
      )
    }
    if (normalizedType === 'income' && !INCOME_CATEGORIES.includes(categoryData.category as PersonalIncomeCategory)) {
      return NextResponse.json(
        { success: false, error: 'category inválida para type income' },
        { status: 400 }
      )
    }
    if (normalizedType === 'expense' && !EXPENSE_CATEGORIES.includes(categoryData.category as PersonalExpenseCategory)) {
      return NextResponse.json(
        { success: false, error: 'category inválida para type expense' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('personal_categories')
      .insert({
        user_id,
        name: nameTrimmed,
        type: normalizedType,
        category: categoryData.category,
        color: categoryData.color,
        icon: categoryData.icon,
        description: categoryData.description || null,
        is_essential: typeof categoryData.is_essential === 'boolean' 
          ? categoryData.is_essential 
          : String(categoryData.is_essential).toLowerCase() === 'true',
        is_active: parseBoolean((categoryData as any).is_active, true),
        budget_limit: typeof categoryData.budget_limit === 'number' 
          ? categoryData.budget_limit 
          : (categoryData.budget_limit !== undefined && categoryData.budget_limit !== null 
            ? parseFloat(String(categoryData.budget_limit)) 
            : null)
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erro ao salvar categoria: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data,
      message: 'Categoria personalizada criada com sucesso'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar categoria personalizada
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, ...categoryData }: { id: string; user_id: string } & Partial<PersonalCategoryData> = body;

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== user_id) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    if (!id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Sistema totalmente pago: sem bloqueio por período gratuito

    const updatePayload: any = { updated_at: new Date().toISOString() }
    if (categoryData.name !== undefined) {
      const nameTrimmed = String(categoryData.name).trim()
      if (!nameTrimmed) {
        return NextResponse.json({ success: false, error: 'name inválido' }, { status: 400 })
      }
      updatePayload.name = nameTrimmed
    }
    if (categoryData.type !== undefined) {
      const normalizedType = normalizeType(categoryData.type)
      if (!normalizedType) {
        return NextResponse.json({ success: false, error: 'type inválido' }, { status: 400 })
      }
      updatePayload.type = normalizedType
    }
    if (categoryData.category !== undefined) {
      const t = updatePayload.type || categoryData.type
      const normalizedType = normalizeType(t)
      if (!normalizedType) {
        return NextResponse.json({ success: false, error: 'type inválido' }, { status: 400 })
      }
      if (normalizedType === 'income' && !INCOME_CATEGORIES.includes(categoryData.category as PersonalIncomeCategory)) {
        return NextResponse.json({ success: false, error: 'category inválida para type income' }, { status: 400 })
      }
      if (normalizedType === 'expense' && !EXPENSE_CATEGORIES.includes(categoryData.category as PersonalExpenseCategory)) {
        return NextResponse.json({ success: false, error: 'category inválida para type expense' }, { status: 400 })
      }
      updatePayload.category = categoryData.category
    }
    if (categoryData.color !== undefined) {
      if (!isHexColor(String(categoryData.color))) {
        return NextResponse.json({ success: false, error: 'color inválido' }, { status: 400 })
      }
      updatePayload.color = categoryData.color
    }
    if (categoryData.icon !== undefined) updatePayload.icon = categoryData.icon
    if (categoryData.description !== undefined) updatePayload.description = categoryData.description || null
    if (categoryData.is_essential !== undefined) {
      updatePayload.is_essential = typeof categoryData.is_essential === 'boolean'
        ? categoryData.is_essential
        : String(categoryData.is_essential).toLowerCase() === 'true'
    }
    if ((categoryData as any).is_active !== undefined) {
      updatePayload.is_active = parseBoolean((categoryData as any).is_active, true)
    }
    if (categoryData.budget_limit !== undefined) {
      updatePayload.budget_limit = typeof categoryData.budget_limit === 'number'
        ? categoryData.budget_limit
        : (categoryData.budget_limit !== null && categoryData.budget_limit !== undefined
          ? parseFloat(String(categoryData.budget_limit))
          : null)
    }

    const { data, error } = await supabase
      .from('personal_categories')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erro ao atualizar categoria: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data,
      message: 'Categoria personalizada atualizada com sucesso'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar categoria personalizada
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

    const supabase = await createSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { error } = await supabase
      .from('personal_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json(
        { success: false, error: `Erro ao deletar categoria: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Categoria personalizada deletada com sucesso'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
