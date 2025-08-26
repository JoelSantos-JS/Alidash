import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

/**
 * GET - Health check para integração N8N
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Testar conectividade com Firebase
    const testDoc = await getDoc(doc(db, 'health-check', 'test'))
    const firebaseLatency = Date.now() - startTime
    
    // Verificar se o Firebase está acessível
    const firebaseStatus = firebaseLatency < 5000 ? 'healthy' : 'slow'
    
    // Verificar variáveis de ambiente necessárias
    const envCheck = {
      firebase: !!process.env.FIREBASE_PROJECT_ID || true, // Firebase config is hardcoded
      nodeEnv: !!process.env.NODE_ENV
    }
    
    const allEnvHealthy = Object.values(envCheck).every(Boolean)
    
    // Status geral
    const overallStatus = firebaseStatus === 'healthy' && allEnvHealthy ? 'healthy' : 'degraded'
    
    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        firebase: {
          status: firebaseStatus,
          latency: `${firebaseLatency}ms`
        },
        environment: {
          status: allEnvHealthy ? 'healthy' : 'missing_vars',
          variables: envCheck
        }
      },
      integration: {
        name: 'Alidash N8N Integration',
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
        firebase: { status: 'error' },
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