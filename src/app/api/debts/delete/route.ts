import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase para evitar problemas de inicialização
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ API route DELETE iniciada');
    
    const { searchParams } = new URL(request.url);
    const debtId = searchParams.get('id');
    const supabaseUserId = searchParams.get('user_id');

    console.log('🗑️ Deletando dívida ID:', debtId, 'para Supabase User ID:', supabaseUserId);

    if (!debtId || !supabaseUserId) {
      console.log('❌ Dados obrigatórios não fornecidos');
      return NextResponse.json(
        { error: 'id e user_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a dívida existe e pertence ao usuário
    const { data: existingDebt, error: checkError } = await supabase
      .from('debts')
      .select('id, user_id')
      .eq('id', debtId)
      .eq('user_id', supabaseUserId)
      .single();

    if (checkError || !existingDebt) {
      console.log('❌ Dívida não encontrada ou não pertence ao usuário:', checkError);
      return NextResponse.json(
        { error: 'Dívida não encontrada ou você não tem permissão para excluí-la' },
        { status: 404 }
      );
    }

    console.log('✅ Dívida encontrada e verificada:', existingDebt.id);

    // Deletar a dívida
    const { error: deleteError } = await supabase
      .from('debts')
      .delete()
      .eq('id', debtId)
      .eq('user_id', supabaseUserId);

    if (deleteError) {
      console.error('❌ Erro ao deletar dívida:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao deletar dívida', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('✅ Dívida deletada com sucesso:', debtId);

    return NextResponse.json({
      success: true,
      message: 'Dívida deletada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro detalhado na API de deleção de dívida:', {
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