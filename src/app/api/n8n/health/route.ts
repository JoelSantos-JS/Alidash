import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET - Health check para integração N8N
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Testar conectividade com Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Fazer uma query simples para testar conectividade
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    const supabaseLatency = Date.now() - startTime
    
    // Verificar se o Supabase está acessível
    const supabaseStatus = !error && supabaseLatency < 5000 ? 'healthy' : 'slow'
    
    // Verificar variáveis de ambiente necessárias
    const envCheck = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: !!process.env.NODE_ENV
    }
    
    const allEnvHealthy = Object.values(envCheck).every(Boolean)
    
    // Status geral
    const overallStatus = supabaseStatus === 'healthy' && allEnvHealthy ? 'healthy' : 'degraded'
    
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        supabase: {
          status: supabaseStatus,
          latency: `${supabaseLatency}ms`,
          error: error?.message || null
        },
        environment: {
          status: allEnvHealthy ? 'healthy' : 'missing_vars',
          variables: envCheck
        }
      },
      integration: {
        name: 'VoxCash N8N Integration',
        endpoints: [
          '/api/n8n/auth',
          '/api/n8n/products', 
          '/api/n8n/analytics',
          '/api/n8n/webhooks',
          '/api/n8n/health'
        ]
      }
    }
    
    const statusCode = overallStatus === 'healthy' ? 200 : 503
    
    return NextResponse.json(healthData, { status: statusCode })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        supabase: { status: 'error' },
        environment: { status: 'unknown' }
      }
    }, { status: 503 })
  }
}

/**
 * POST - Health check with ping test
 */
export async function POST(request: NextRequest) {
  try {
    const { test } = await request.json()
    
    if (test === 'ping') {
      return NextResponse.json({
        status: 'healthy',
        message: 'pong',
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      status: 'healthy',
      message: 'N8N integration is running',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Invalid request',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}