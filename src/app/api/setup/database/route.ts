import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Criar tabela de backup
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS firebase_backup (
          id BIGSERIAL PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          products JSONB DEFAULT '[]'::jsonb,
          dreams JSONB DEFAULT '[]'::jsonb,
          bets JSONB DEFAULT '[]'::jsonb,
          last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_firebase_backup_user_id ON firebase_backup(user_id);
        CREATE INDEX IF NOT EXISTS idx_firebase_backup_last_sync ON firebase_backup(last_sync);
      `
    })

    if (tableError) {
      // Se rpc não funcionar, tentar método direto
      const { error: directError } = await supabase
        .from('firebase_backup')
        .select('id')
        .limit(1)

      if (directError && directError.code === '42P01') {
        return NextResponse.json({ 
          success: false,
          error: 'Tabela não existe. Execute o SQL manualmente no Supabase.',
          sql: `
            CREATE TABLE firebase_backup (
              id BIGSERIAL PRIMARY KEY,
              user_id TEXT UNIQUE NOT NULL,
              products JSONB DEFAULT '[]'::jsonb,
              dreams JSONB DEFAULT '[]'::jsonb,
              bets JSONB DEFAULT '[]'::jsonb,
              last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        }, { status: 500 })
      }
    }

    // Testar se a tabela existe tentando fazer uma query
    const { data, error: testError } = await supabase
      .from('firebase_backup')
      .select('count')
      .limit(1)

    if (testError) {
      return NextResponse.json({ 
        success: false,
        error: testError.message,
        needsManualSetup: true
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Banco de dados configurado com sucesso!',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      needsManualSetup: true
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Verificar se a tabela existe
    const { data, error } = await supabase
      .from('firebase_backup')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        success: false,
        tableExists: false,
        error: error.message
      })
    }

    return NextResponse.json({ 
      success: true,
      tableExists: true,
      message: 'Tabela de backup existe e está funcionando'
    })

  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      tableExists: false,
      error: error.message
    })
  }
} 