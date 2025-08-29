import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔧 Variáveis de ambiente no servidor:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'Não definida');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Definida' : 'Não definida');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRole ? 'Definida' : 'Não definida');

    return NextResponse.json({
      success: true,
      env: {
        supabaseUrl: supabaseUrl ? 'Definida' : 'Não definida',
        supabaseAnonKey: supabaseAnonKey ? 'Definida' : 'Não definida',
        supabaseServiceRole: supabaseServiceRole ? 'Definida' : 'Não definida'
      }
    });
  } catch (error) {
    console.error('❌ Erro ao verificar variáveis de ambiente:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar variáveis de ambiente' },
      { status: 500 }
    );
  }
}