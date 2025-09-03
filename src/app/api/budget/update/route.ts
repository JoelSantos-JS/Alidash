import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase para evitar problemas de inicialização
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API route POST iniciada');
    
    const body = await request.json();
    const { user_id: firebaseUid, monthly_budget } = body;

    console.log('💰 Atualizando orçamento para Firebase UID:', firebaseUid, 'Valor:', monthly_budget);

    if (!firebaseUid || monthly_budget === undefined) {
      console.log('❌ Dados obrigatórios não fornecidos');
      return NextResponse.json(
        { error: 'user_id e monthly_budget são obrigatórios' },
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
      return NextResponse.json(
        { error: 'Usuário não encontrado no Supabase' },
        { status: 404 }
      );
    }

    console.log('✅ Usuário encontrado:', user.id);

    // Tentar atualizar orçamento existente
    const { data: updatedBudget, error: updateError } = await supabase
      .from('budgets')
      .update({
        monthly_budget: monthly_budget,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.log('⚠️ Orçamento não existe, criando novo:', updateError.message);
      
      // Criar novo orçamento
      const { data: newBudget, error: createError } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          monthly_budget: monthly_budget,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar orçamento:', createError);
        return NextResponse.json(
          { error: 'Erro ao criar orçamento', details: createError.message },
          { status: 500 }
        );
      }

      console.log('✅ Orçamento criado:', newBudget);
      return NextResponse.json({
        success: true,
        budget: newBudget,
        message: 'Orçamento criado com sucesso'
      });
    }

    console.log('✅ Orçamento atualizado:', updatedBudget);

    return NextResponse.json({
      success: true,
      budget: updatedBudget,
      message: 'Orçamento atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro detalhado na API de atualização de orçamento:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}