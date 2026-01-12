import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function isInternalAuthorized(request: NextRequest) {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected) return process.env.NODE_ENV !== 'production'
  const provided = request.headers.get('x-internal-key')
  return !!provided && provided === expected
}

export async function GET(request: NextRequest) {
  try {
    if (!isInternalAuthorized(request)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Check if environment variables are present
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing Supabase environment variables',
        missing: {
          url: !supabaseUrl,
          anonKey: !supabaseAnonKey,
          serviceRole: !supabaseServiceRole
        }
      }, { status: 500 })
    }

    // Test connection with anon key
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    
    // Test connection with service role key  
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole)

    // Simple ping test - try to access auth
    const { data: authData, error: authError } = await supabaseClient.auth.getSession()
    
    return NextResponse.json({
      status: 'success',
      message: 'Supabase connection test completed',
      tests: {
        environmentVariables: '✅ All set',
        clientCreation: '✅ Client created successfully',
        adminCreation: '✅ Admin client created successfully',
        authPing: authError ? `⚠️ ${authError.message}` : '✅ Auth accessible',
      },
      config: {
        url: supabaseUrl,
        anonKeyLength: supabaseAnonKey.length,
        serviceRoleKeyLength: supabaseServiceRole.length
      }
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to test Supabase connection'
    }, { status: 500 })
  }
}
