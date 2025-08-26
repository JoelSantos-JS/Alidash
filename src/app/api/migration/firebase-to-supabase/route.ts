import { NextRequest, NextResponse } from 'next/server'
import { migrateAllUsers, migrateSingleUser, type MigrationProgress } from '@/lib/firebase-to-supabase-migration'

/**
 * POST - Start complete migration from Firebase to Supabase
 * Body: { type: 'all' | 'single', firebaseUid?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { type, firebaseUid } = await request.json()

    if (!type || (type !== 'all' && type !== 'single')) {
      return NextResponse.json({ 
        error: 'Type deve ser "all" ou "single"' 
      }, { status: 400 })
    }

    if (type === 'single' && !firebaseUid) {
      return NextResponse.json({ 
        error: 'firebaseUid é obrigatório para migração single' 
      }, { status: 400 })
    }

    // For a real implementation, you'd want to run this in the background
    // and return a job ID for status checking
    let result;
    
    if (type === 'all') {
      result = await migrateAllUsers()
    } else {
      result = await migrateSingleUser(firebaseUid)
    }

    return NextResponse.json({
      success: true,
      migration: result
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET - Check migration status or run migration check
 * Query params: ?check=true to run a migration check
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const check = url.searchParams.get('check')

    if (check === 'true') {
      // Run a migration check to see what would be migrated
      // This is a dry run that doesn't actually migrate data
      
      return NextResponse.json({
        status: 'ready',
        message: 'Migration check completed',
        // You could add statistics here about what would be migrated
        estimatedData: {
          users: 0,
          products: 0,
          dreams: 0,
          bets: 0
        }
      })
    }

    // Return general migration status
    return NextResponse.json({
      status: 'ready',
      message: 'Migration service is available',
      endpoints: {
        startMigration: 'POST /api/migration/firebase-to-supabase',
        checkStatus: 'GET /api/migration/firebase-to-supabase?check=true'
      }
    })

  } catch (error) {
    console.error('Migration status error:', error)
    return NextResponse.json({ 
      error: 'Erro ao verificar status da migração' 
    }, { status: 500 })
  }
}