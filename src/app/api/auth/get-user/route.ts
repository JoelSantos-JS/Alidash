import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get('firebase_uid');
    const email = searchParams.get('email');

    if (!firebaseUid && !email) {
      return NextResponse.json(
        { error: 'Firebase UID ou email é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando usuário no Supabase:', { firebaseUid, email });

    let user = null;

    // Tentar buscar pelo Firebase UID primeiro
    if (firebaseUid) {
      const { data: userByUid, error: uidError } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (!uidError && userByUid) {
        user = userByUid;
        console.log('✅ Usuário encontrado pelo Firebase UID');
      }
    }

    // Se não encontrou pelo UID, tentar pelo email
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