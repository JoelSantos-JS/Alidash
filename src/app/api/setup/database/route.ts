import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'

function isInternalAuthorized(request: NextRequest) {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected) return process.env.NODE_ENV !== 'production'
  const provided = request.headers.get('x-internal-key')
  return !!provided && provided === expected
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    if (!isInternalAuthorized(request)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const userData = await request.json();
    
    // Extract user data from request
    const { email, name, avatar_url } = userData;
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'email is required'
      }, { status: 400 });
    }
    
    // Check if user already exists
    let user = await supabaseAdminService.getUserByEmail(email);
    
    if (!user) {
      // Create user in Supabase
      console.log('👤 Creating user in Supabase:', { email, name });
      user = await supabaseAdminService.createUser({
        email,
        name: name || null,
        avatar_url: avatar_url || null,
        account_type: 'personal'
      });
      console.log('✅ User created successfully:', user.id);
    } else {
      console.log('👤 User already exists in Supabase:', user.id);
      
      // Update last login
      await supabaseAdminService.updateUserLastLogin(user.id);
    }
    
    // Ensure backup table exists
    await ensureBackupTableExists();
    
    return NextResponse.json({
      success: true,
      message: 'User setup completed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Error in user setup:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error during user setup',
      details: error.toString()
    }, { status: 500 });
  }
}

async function ensureBackupTableExists() {
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
    });

    if (tableError) {
      // Se rpc não funcionar, tentar método direto
      const { error: directError } = await supabase
        .from('firebase_backup')
        .select('id')
        .limit(1);

      if (directError && directError.code === '42P01') {
        console.warn('Backup table does not exist and could not be created automatically');
      }
    }
  } catch (error) {
    console.warn('Error ensuring backup table exists:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isInternalAuthorized(request)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

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
