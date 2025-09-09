import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configurar fetch customizado para evitar problemas com undici
const customFetch = (url: string, options?: RequestInit) => {
  return fetch(url, {
    ...options,
    // Adicionar headers para evitar problemas de conectividade
    headers: {
      'User-Agent': 'NextJS-API-Route/1.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Debug das variáveis de ambiente
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Debug Supabase config:', {
    url: supabaseUrl ? 'Definida' : 'Não definida',
    serviceKey: supabaseServiceKey ? 'Definida' : 'Não definida',
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseServiceKey?.length || 0
  });
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

// Testar conexão básica
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Testando conexão básica com Supabase...');
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente do Supabase não configuradas');
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      );
    }

    const { firebase_uid, email, name, avatar_url } = await request.json();

    if (!firebase_uid || !email) {
      return NextResponse.json(
        { error: 'Firebase UID e email são obrigatórios' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Sincronizando usuário:', { firebase_uid, email });
    }

    // Verificar se o usuário já existe no Supabase
    let supabaseUser;
    try {
      supabaseUser = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebase_uid)
        .single();
    } catch (supabaseError: any) {
      console.error('❌ Erro ao buscar usuário:', {
        message: supabaseError.message,
        details: supabaseError.toString(),
        hint: 'Verifique a conectividade com o Supabase e as configurações de RLS',
        code: supabaseError.code || 'UNKNOWN'
      });
      
      return NextResponse.json(
        { 
          error: 'Erro de conectividade com o banco de dados',
          details: process.env.NODE_ENV === 'development' ? supabaseError.message : undefined
        },
        { status: 503 }
      );
    }

    if (supabaseUser.error && supabaseUser.error.code === 'PGRST116') {
      // Usuário não encontrado, criar novo
      if (process.env.NODE_ENV === 'development') {
        console.log('👤 Criando novo usuário no Supabase...');
      }
      
      let newUser, createError;
      try {
        const result = await supabase
          .from('users')
          .insert({
            firebase_uid,
            email,
            name: name || null,
            avatar_url: avatar_url || null,
            account_type: 'personal'
          })
          .select()
          .single();
        
        newUser = result.data;
        createError = result.error;
      } catch (insertError: any) {
        console.error('❌ Erro ao inserir usuário:', {
          message: insertError.message,
          details: insertError.toString(),
          hint: 'Verifique as permissões RLS e estrutura da tabela users',
          code: insertError.code || 'UNKNOWN'
        });
        
        createError = insertError;
      }

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
        
        // Se falhar ao criar, tentar buscar pelo email
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Tentando buscar usuário pelo email...');
        }
        const { data: usersByEmail, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .limit(1);
        
        if (!emailError && usersByEmail && usersByEmail.length > 0) {
          // Atualizar o usuário existente com o Firebase UID
          const existingUser = usersByEmail[0];
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Atualizando usuário existente com Firebase UID...');
          }
          
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ firebase_uid })
            .eq('id', existingUser.id)
            .select()
            .single();
          
          if (updateError) {
            console.error('❌ Erro ao atualizar Firebase UID:', updateError);
            return NextResponse.json(
              { error: 'Erro ao atualizar usuário existente' },
              { status: 500 }
            );
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('✅ Firebase UID atualizado com sucesso');
            }
            return NextResponse.json({
              success: true,
              user: updatedUser,
              action: 'updated'
            });
          }
        } else {
          return NextResponse.json(
            { error: 'Erro ao criar usuário e não foi possível encontrar usuário existente' },
            { status: 500 }
          );
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Usuário criado no Supabase:', newUser.id);
        }
        return NextResponse.json({
          success: true,
          user: newUser,
          action: 'created'
        });
      }
    } else if (supabaseUser.error) {
      console.error('❌ Erro ao buscar usuário:', supabaseUser.error);
      return NextResponse.json(
        { error: 'Erro ao buscar usuário' },
        { status: 500 }
      );
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Usuário já existe no Supabase:', supabaseUser.data.id);
      }
      return NextResponse.json({
        success: true,
        user: supabaseUser.data,
        action: 'exists'
      });
    }

  } catch (error: any) {
    console.error('❌ Erro geral na sincronização:', {
      message: error.message,
      details: error.toString(),
      hint: 'Verifique a conectividade com o Supabase e as configurações',
      code: error.code || 'UNKNOWN'
    });
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}