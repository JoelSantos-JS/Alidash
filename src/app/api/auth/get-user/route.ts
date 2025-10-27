import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID ou email é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando usuário no Supabase:', { userId, email });

    let user = null;

    // Tentar buscar pelo User ID primeiro
    if (userId) {
      const { data: userById, error: idError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!idError && userById) {
        user = userById;
        console.log('✅ Usuário encontrado pelo User ID');
      }
    }

    // Se não encontrou pelo ID, tentar pelo email
    if (!user && email) {
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!emailError && userByEmail) {
        user = userByEmail;
        console.log('✅ Usuário encontrado pelo email');
      }
    }

    if (user) {
      return NextResponse.json({
        success: true,
        user
      });
    } else {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}