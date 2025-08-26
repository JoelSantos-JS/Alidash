import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if environment variables are loaded
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

    return NextResponse.json({
      status: 'success',
      environment: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✅ SET' : '❌ NOT SET',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ SET' : '❌ NOT SET',
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRole ? '✅ SET' : '❌ NOT SET',
      },
      urls: {
        supabaseUrl: supabaseUrl || 'NOT SET'
      },
      message: 'Environment variables check completed'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}