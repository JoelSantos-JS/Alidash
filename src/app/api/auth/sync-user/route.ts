import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
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
    let supabaseUser = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', firebase_uid)
      .single();

    if (supabaseUser.error && supabaseUser.error.code === 'PGRST116') {
      // Usuário não encontrado, criar novo
      if (process.env.NODE_ENV === 'development') {
        console.log('👤 Criando novo usuário no Supabase...');
      }
      
      const { data: newUser, error: createError } = await supabase
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

  } catch (error) {
    console.error('❌ Erro geral na sincronização:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 