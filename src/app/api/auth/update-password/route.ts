import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  const routeStart = Date.now()
  try {
    const body = await request.json().catch(() => ({} as any))
    const password = String(body?.password || '')

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'invalid_password' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData?.session?.access_token
    if (!accessToken) {
      return NextResponse.json({ error: 'session_missing' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 })
    }

    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timeoutMs = 12_000
    const timer = setTimeout(() => {
      try {
        ac?.abort()
      } catch {}
    }, timeoutMs)

    try {
      const res = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        signal: ac?.signal,
        cache: 'no-store',
      })

      const json = await res.json().catch(() => ({} as any))
      const serverTiming = `total;dur=${Math.round(Date.now() - routeStart)}`

      if (!res.ok) {
        const msg = String(json?.msg || json?.message || json?.error_description || json?.error || '')
        return NextResponse.json(
          { error: msg || `Falha ao redefinir senha (${res.status})` },
          { status: res.status, headers: { 'Server-Timing': serverTiming } }
        )
      }

      return NextResponse.json(
        { success: true },
        { headers: { 'Server-Timing': serverTiming } }
      )
    } finally {
      clearTimeout(timer)
    }
  } catch (err: any) {
    const msg = String(err?.message || '')
    const serverTiming = `total;dur=${Math.round(Date.now() - routeStart)}`
    const isAbort =
      msg.toLowerCase().includes('abort') ||
      msg.toLowerCase().includes('timeout') ||
      String(err?.name || '').toLowerCase().includes('abort')
    return NextResponse.json(
      { error: isAbort ? 'timeout' : (msg || 'Erro interno do servidor') },
      { status: isAbort ? 504 : 500, headers: { 'Server-Timing': serverTiming } }
    )
  }
}

