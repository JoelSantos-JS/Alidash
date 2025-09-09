import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdminService } from '@/lib/supabase-service';

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
  budget_limit?: number;
}

// GET - Buscar categorias personalizadas do usuário
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando categorias personalizadas para usuário:', userId);

    // Buscar categorias reais do banco de dados
    const { data, error } = await supabaseAdminService.client
      .from('personal_categories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar categorias do banco:', error);
      return NextResponse.json(
        { success: false, error: `Erro ao buscar categorias: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Categorias encontradas:', data?.length || 0);

    return NextResponse.json({
      success: true,
      categories: data || []
    });

  } catch (error) {
    console.error('❌ Erro ao buscar categorias personalizadas:', error);
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

    console.log('📝 Criando categoria personalizada:', { user_id, categoryData });

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id é obrigatório' },
        { status: 400 }
      );
    }

    // Validar dados obrigatórios
    if (!categoryData.name || !categoryData.type || !categoryData.category || !categoryData.color || !categoryData.icon) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: name, type, category, color, icon' },
        { status: 400 }
      );
    }

    // Salvar no banco de dados real
    const { data, error } = await supabaseAdminService.client
      .from('personal_categories')
      .insert({
        user_id,
        name: categoryData.name,
        type: categoryData.type,
        category: categoryData.category,
        color: categoryData.color,
        icon: categoryData.icon,
        description: categoryData.description || null,
        is_essential: categoryData.is_essential || false,
        budget_limit: categoryData.budget_limit || null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar categoria no banco:', error);
      return NextResponse.json(
        { success: false, error: `Erro ao salvar categoria: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Categoria personalizada criada no banco:', data.id);

    return NextResponse.json({
      success: true,
      category: data,
      message: 'Categoria personalizada criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar categoria personalizada:', error);
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

    console.log('📝 Atualizando categoria personalizada:', { id, user_id, categoryData });

    if (!id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Atualizar no banco de dados real
    const { data, error } = await supabaseAdminService.client
      .from('personal_categories')
      .update({
        name: categoryData.name,
        type: categoryData.type,
        category: categoryData.category,
        color: categoryData.color,
        icon: categoryData.icon,
        description: categoryData.description || null,
        is_essential: categoryData.is_essential || false,
        budget_limit: categoryData.budget_limit || null
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar categoria no banco:', error);
      return NextResponse.json(
        { success: false, error: `Erro ao atualizar categoria: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Categoria personalizada atualizada no banco:', id);

    return NextResponse.json({
      success: true,
      category: data,
      message: 'Categoria personalizada atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar categoria personalizada:', error);
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

    console.log('🗑️ Deletando categoria personalizada:', { id, userId });

    if (!id || !userId) {
      return NextResponse.json(
        { success: false, error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Deletar do banco de dados real
    const { error } = await supabaseAdminService.client
      .from('personal_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Erro ao deletar categoria do banco:', error);
      return NextResponse.json(
        { success: false, error: `Erro ao deletar categoria: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Categoria personalizada deletada do banco:', id);

    return NextResponse.json({
      success: true,
      message: 'Categoria personalizada deletada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar categoria personalizada:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}