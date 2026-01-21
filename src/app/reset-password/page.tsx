'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-service'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [validRecovery, setValidRecovery] = useState(false)
  const recoveryContextRef = useRef(false)

  const updatePasswordViaApiRoute = async (newPassword: string) => {
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null
    const t = ac ? window.setTimeout(() => ac.abort(), 12_000) : null
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
        signal: ac?.signal,
        cache: 'no-store',
      })
      const json = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        const msg = String(json?.error || json?.message || '')
        const err: any = new Error(msg || `Falha ao redefinir senha (${res.status})`)
        err.status = res.status
        throw err
      }
      return json
    } finally {
      if (t) window.clearTimeout(t)
    }
  }

  const updatePasswordViaFetch = async (accessToken: string, newPassword: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase não configurado')
    }

    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null
    const timeoutMs = 12_000
    const abortTimer = window.setTimeout(() => {
      try {
        ac?.abort()
      } catch {}
    }, timeoutMs)
    try {
      let timeoutTimer: number | null = null
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutTimer = window.setTimeout(() => reject(new Error('timeout')), timeoutMs)
      })
      const fetchPromise = fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
        signal: ac?.signal,
      })

      const res = await Promise.race([fetchPromise, timeoutPromise])
      if (timeoutTimer) window.clearTimeout(timeoutTimer)

      const json = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        const msg = String(json?.msg || json?.message || json?.error_description || json?.error || '')
        throw new Error(msg || `Falha ao redefinir senha (${res.status})`)
      }
      return json
    } finally {
      window.clearTimeout(abortTimer)
    }
  }

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const type = url.searchParams.get('type')
        const isRecoveryType = type === 'recovery'
        let fromUrl = false
        if (code) {
          fromUrl = true
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            toast.error('Link inválido ou expirado')
            return
          }
          url.searchParams.delete('code')
          if (isRecoveryType) url.searchParams.delete('type')
          window.history.replaceState({}, '', url.toString())
        } else {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          if (accessToken && refreshToken) {
            fromUrl = true
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            if (error) {
              toast.error('Link inválido ou expirado')
              return
            }
            window.history.replaceState({}, '', window.location.pathname + window.location.search)
          }
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (fromUrl) recoveryContextRef.current = true
        if (!cancelled && session && recoveryContextRef.current) {
          setValidRecovery(true)
        }
      } catch {
        toast.error('Erro ao validar link de recuperação')
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryContextRef.current = true
        setValidRecovery(true)
      } else if (event === 'SIGNED_IN' && recoveryContextRef.current) {
        setValidRecovery(true)
      }
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      toast.error('As senhas não conferem')
      return
    }
    try {
      setLoading(true)
      try {
        await updatePasswordViaApiRoute(password)
      } catch (err: any) {
        const status = Number(err?.status || 0) || undefined
        if (status === 401) {
          const sessionResult = await Promise.race([
            supabase.auth.getSession(),
            new Promise<{ data: { session: any } }>((_, reject) =>
              window.setTimeout(() => reject(new Error('timeout')), 3_000)
            ),
          ])
          const session = (sessionResult as any)?.data?.session
          if (!session) {
            toast.error('Sessão de recuperação ausente. Abra o link do email novamente.')
            return
          }
          try {
            await updatePasswordViaFetch(session.access_token, password)
          } catch (fallbackErr: any) {
            const msg = String(fallbackErr?.message || '')
            const lower = msg.toLowerCase()
            if (lower.includes('auth session missing') || (lower.includes('session') && lower.includes('missing'))) {
              toast.error('Sessão inválida ou expirada. Solicite um novo link.')
            } else if (lower.includes('expired') || lower.includes('invalid')) {
              toast.error('Link inválido ou expirado. Solicite um novo link.')
            } else if (lower.includes('password') && lower.includes('different')) {
              toast.error('A nova senha precisa ser diferente da anterior')
            } else if (lower.includes('abort') || lower.includes('timeout')) {
              toast.error('Tempo esgotado ao salvar. Tente novamente.')
            } else if (lower.includes('failed to fetch')) {
              toast.error('Falha de rede ao salvar. Tente novamente.')
            } else {
              toast.error(msg || 'Erro ao redefinir senha')
            }
            return
          }
        } else {
          const msg = String(err?.message || '')
          const lower = msg.toLowerCase()
          if (lower.includes('password') && lower.includes('different')) {
            toast.error('A nova senha precisa ser diferente da anterior')
          } else if (lower.includes('abort') || lower.includes('timeout')) {
            toast.error('Tempo esgotado ao salvar. Tente novamente.')
          } else if (lower.includes('failed to fetch')) {
            toast.error('Falha de rede ao salvar. Tente novamente.')
          } else if (lower.includes('expired') || lower.includes('invalid')) {
            toast.error('Link inválido ou expirado. Solicite um novo link.')
          } else {
            toast.error(msg || 'Erro ao redefinir senha')
          }
          return
        }
      }
      toast.success('Senha alterada com sucesso!')
      try {
        try {
          const ac = typeof AbortController !== 'undefined' ? new AbortController() : null
          const t = ac ? window.setTimeout(() => ac.abort(), 1500) : null
          await fetch('/api/auth/logout', { method: 'POST', signal: ac?.signal, cache: 'no-store' })
          if (t) window.clearTimeout(t)
        } catch {}
        await Promise.race([
          supabase.auth.signOut({ scope: 'local' } as any),
          new Promise((resolve) => window.setTimeout(() => resolve(null), 1000))
        ])
      } catch {}
      setValidRecovery(false)
      router.replace('/login')
      try {
        window.setTimeout(() => window.location.replace('/login'), 50)
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md border rounded-lg p-6">
        <h1 className="text-xl font-semibold mb-4">Redefinir Senha</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {validRecovery ? 'Insira sua nova senha abaixo.' : 'Abra este link a partir do email de recuperação.'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Nova Senha</label>
            <input
              id="password"
              type="password"
              className="w-full border rounded-md px-3 py-2 bg-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={!validRecovery || loading}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm" className="text-sm font-medium">Confirmar Senha</label>
            <input
              id="confirm"
              type="password"
              className="w-full border rounded-md px-3 py-2 bg-transparent"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={!validRecovery || loading}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={!validRecovery || loading}
            className="w-full bg-primary text-primary-foreground rounded-md px-3 py-2"
          >
            {loading ? 'Salvando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
