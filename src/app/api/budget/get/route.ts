import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase para evitar problemas de inicialização
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API route GET iniciada');
    
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get('user_id');

    console.log('🔍 Buscando orçamento para Firebase UID:', firebaseUid);

    if (!firebaseUid) {
      console.log('❌ user_id (firebase_uid) não fornecido');
      return NextResponse.json(
        { error: 'user_id (firebase_uid) é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo firebase_uid
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();

    if (userError || !user) {
      console.log('❌ Usuário não encontrado:', userError);
      return NextResponse.json({ 
        success: true, 
        budget: { monthly_budget: 400 }, // Valor padrão
        message: 'Usuário não encontrado no Supabase, usando valor padrão'
      });
    }

    console.log('✅ Usuário encontrado:', user.id);

    // Buscar orçamento do usuário
    const { data: budget, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (budgetError) {
      console.log('⚠️ Orçamento não encontrado, criando padrão:', budgetError.message);
      
      // Criar orçamento padrão
      const { data: newBudget, error: createError } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          monthly_budget: 400,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar orçamento padrão:', createError);
        return NextResponse.json({ 
          success: true, 
          budget: { monthly_budget: 400 },
          message: 'Erro ao criar orçamento, usando valor padrão'
        });
      }

      console.log('✅ Orçamento padrão criado:', newBudget);
      return NextResponse.json({
        success: true,
        budget: newBudget
      });
    }

    console.log('✅ Orçamento encontrado:', budget);

    return NextResponse.json({
      success: true,
      budget: budget
    });

  } catch (error) {
    console.error('❌ Erro detalhado na API de orçamento:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: true,
        budget: { monthly_budget: 400 },
        error: 'Erro interno do servidor, usando valor padrão',
        timestamp: new Date().toISOString()
      },
      { status: 200 } // Retorna 200 com valor padrão para não quebrar o frontend
    );
  }
}