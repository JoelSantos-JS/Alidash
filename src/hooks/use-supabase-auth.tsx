'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, supabaseService } from '@/lib/supabase-service'
import { toast } from 'sonner'
import { LoaderCircle, CheckCircle2 } from 'lucide-react'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const routerRef = useRef(router)
  const pathnameRef = useRef(pathname)
  const hasShownLoginToastRef = useRef(false)
  // Evitar rodar getSession múltiplas vezes em dev/StrictMode
  const hasInitializedSessionRef = useRef(false)
  // Manter uma única assinatura de auth ativa
  const authSubscriptionRef = useRef<ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null>(null)
  // Guardas de proteção contra múltiplos cadastros
  const signUpInProgressRef = useRef(false)
  const lastSignUpAttemptRef = useRef<{ email: string; at: number } | null>(null)
  const resetInProgressRef = useRef(false)
  const lastResetAttemptRef = useRef<{ email: string; at: number } | null>(null)
  const sessionTimeoutRef = useRef<number | null>(null)
  const SESSION_TIMEOUT_MS = 60 * 60 * 1000
  const SESSION_LOGIN_AT_KEY = 'alidash:session_login_at'
  const PASSWORD_RESET_COOLDOWN_MS = 5 * 60 * 1000

  const clearSessionTimer = () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current)
      sessionTimeoutRef.current = null
    }
  }

  useEffect(() => {
    routerRef.current = router
  }, [router])

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  const forceLogoutDueToTimeout = async () => {
    try {
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch {}
      await supabase.auth.signOut()
      toast.error('Sua sessão expirou após 1 hora. Faça login novamente.')
      routerRef.current.push('/login')
    } catch {}
  }

  const scheduleSessionExpiration = (loginAt: number) => {
    const expiresAt = loginAt + SESSION_TIMEOUT_MS
    const now = Date.now()
    const remaining = expiresAt - now
    clearSessionTimer()
    if (remaining <= 0) {
      forceLogoutDueToTimeout()
      return
    }
    sessionTimeoutRef.current = window.setTimeout(() => {
      forceLogoutDueToTimeout()
    }, remaining)
  }

  // Prevent hydration mismatch by ensuring consistent initial state
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    // Inicializar sessão apenas uma vez por ciclo de vida da página
    const getInitialSession = async () => {
      try {
        console.log('🚀 Obtendo sessão inicial...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('📋 Sessão obtida:', session ? 'Usuário logado' : 'Sem sessão', error ? `Erro: ${error.message}` : 'Sem erro')
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error)
          setLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        // If user exists, ensure they exist in our database
        if (session?.user) {
          try {
            const existingLoginAt =
              typeof window !== 'undefined' ? window.localStorage.getItem(SESSION_LOGIN_AT_KEY) : null
            const parsedLoginAt = existingLoginAt ? parseInt(existingLoginAt, 10) : NaN
            const now = Date.now()
            const shouldResetLoginAt =
              !existingLoginAt || Number.isNaN(parsedLoginAt) || now - parsedLoginAt > SESSION_TIMEOUT_MS
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(SESSION_LOGIN_AT_KEY, String(shouldResetLoginAt ? now : parsedLoginAt))
            }
            scheduleSessionExpiration(shouldResetLoginAt ? now : parsedLoginAt)
          } catch {}
          console.log('👤 Usuário encontrado na sessão, verificando no banco...')
          try {
            await ensureUserInDatabase(session.user)
            console.log('✅ Verificação do usuário no banco concluída')
          } catch (error) {
            console.error('❌ Erro ao sincronizar usuário:', error)
            // Continue mesmo com erro - não bloquear o fluxo de autenticação
          }
        } else {
          console.log('🚫 Nenhum usuário na sessão')
        }
        
        console.log('🏁 getInitialSession concluída, definindo loading como false')
        setLoading(false)
      } catch (error) {
        console.error('❌ Erro inesperado ao obter sessão:', error)
        setLoading(false)
      }
    }
    if (!hasInitializedSessionRef.current) {
      console.log('🔧 Inicializando sessão do AuthProvider')
      hasInitializedSessionRef.current = true
      getInitialSession()
    } else {
      console.log('⏭️ Sessão já inicializada, pulando getSession')
    }

    // Assinar mudanças de auth uma única vez
    if (!authSubscriptionRef.current) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)

        if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session?.user) {
          try {
            try {
              const now = Date.now()
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(SESSION_LOGIN_AT_KEY, String(now))
              }
              scheduleSessionExpiration(now)
            } catch {}
            await ensureUserInDatabase(session.user)
            await supabaseService.updateUserLastLogin(session.user.id)
            // Redireciona apenas quando vindo de páginas de auth
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathnameRef.current
            const isAuthPage = currentPath === '/login' || currentPath === '/cadastro'
            if (isAuthPage) {
              routerRef.current.push('/')
            }
            // Evita mostrar o toast repetidas vezes ao navegar pelo app
            if (!hasShownLoginToastRef.current) {
              toast.success('Login realizado com sucesso!', {
                style: {
                  background: '#2563eb',
                  color: '#ffffff',
                  border: '1px solid #1d4ed8'
                },
                className: 'shadow-lg',
                icon: <CheckCircle2 size={18} className="text-white" />,
              })
              hasShownLoginToastRef.current = true
            }
          } catch (error) {
            console.error('Erro pós-login:', error)
            toast.error('Erro ao finalizar login')
            // Não impedir o login por causa de erros de sincronização
          }
        } else if (event === 'SIGNED_OUT') {
          clearSessionTimer()
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(SESSION_LOGIN_AT_KEY)
            }
          } catch {}
          hasShownLoginToastRef.current = false
          routerRef.current.push('/login')
        }
        
        // Garantir que loading seja sempre false após mudanças de estado
        setLoading(false)
      }
      )
      authSubscriptionRef.current = subscription
      console.log('🔗 Assinatura de auth criada')
    } else {
      console.log('🔁 Assinatura de auth já existente')
    }

    return () => {
      console.log('🧹 Cleanup do AuthProvider: removendo assinatura de auth')
      try {
        authSubscriptionRef.current?.unsubscribe()
      } catch {}
      clearSessionTimer()
      authSubscriptionRef.current = null
      hasInitializedSessionRef.current = false
    }
  }, [])

  const ensureUserInDatabase = async (authUser: User) => {
    try {
      console.log('🔄 Verificando usuário no banco de dados:', authUser.id, authUser.email)
      
      // Check if user exists in our database
      const existingUser = await supabaseService.getUserById(authUser.id)
      
      if (!existingUser) {
        console.log('👤 Usuário não encontrado, criando no banco de dados...')
        
        // Create user in our database
        const newUser = await supabaseService.createUser({
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          account_type: 'personal'
        })
        
        console.log('✅ Usuário criado no banco de dados:', newUser)
      } else {
        console.log('✅ Usuário já existe no banco de dados:', existingUser.email)
      }
    } catch (error) {
      console.error('❌ Erro ao garantir usuário no banco:', error)
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      
      // Don't throw the error to prevent blocking the auth flow
      // Instead, log it and continue
      console.warn('⚠️ Continuando com o fluxo de autenticação apesar do erro')
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        throw error
      }

      // Success is handled by the auth state change listener
    } catch (error) {
      console.error('Erro no login:', error)
      
      if (error instanceof Error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor, confirme seu email antes de fazer login')
        } else if (error.message.includes('Too many requests')) {
          toast.error('Muitas tentativas. Tente novamente em alguns minutos')
        } else {
          toast.error('Erro ao fazer login. Tente novamente')
        }
      } else {
        toast.error('Erro inesperado ao fazer login')
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Evitar chamadas concorrentes
      if (signUpInProgressRef.current) {
        toast.error('Cadastro já está em andamento. Aguarde alguns segundos')
        return
      }
      // Evitar estouro de limite: bloquear nova tentativa do mesmo email por 60s
      const now = Date.now()
      if (lastSignUpAttemptRef.current && lastSignUpAttemptRef.current.email === email.trim()) {
        const elapsedMs = now - lastSignUpAttemptRef.current.at
        if (elapsedMs < 60_000) {
          toast.error('Muitas tentativas com este email. Tente novamente em 1 minuto')
          return
        }
      }
      signUpInProgressRef.current = true
      setLoading(true)

      const baseUrl = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
        : (process.env.NEXT_PUBLIC_APP_URL || '')

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name?.trim() || null,
            full_name: name?.trim() || null
          },
          emailRedirectTo: baseUrl ? `${baseUrl}/login` : undefined
        }
      })

      if (error) {
        // Fallback: se limite de email foi excedido, criar usuário via Admin API (sem enviar email)
        const isRateLimit = String(error.message || '').toLowerCase().includes('rate limit') || String(error.status || '').includes('429')
        if (isRateLimit) {
          try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            const adminKey = process.env.NEXT_PUBLIC_ADMIN_SIGNUP_KEY
            if (adminKey) headers['x-api-key'] = adminKey
            const resp = await fetch('/api/auth/admin-signup', {
              method: 'POST',
              headers,
              body: JSON.stringify({ email: email.trim(), password, name })
            })
            if (!resp.ok) {
              const data = await resp.json().catch(() => ({}))
              throw new Error(data?.error || 'Falha no cadastro admin')
            }
            const resJson = await resp.json()
            // Login após criar com admin
            await supabase.auth.signInWithPassword({ email: email.trim(), password })
            toast.success('Cadastro realizado com sucesso!')
            return
          } catch (fallbackErr) {
            throw fallbackErr
          }
        } else {
          throw error
        }
      }

      lastSignUpAttemptRef.current = { email: email.trim(), at: now }

      if (data.user && !data.session) {
        toast.success('Cadastro realizado com sucesso!')
        try {
          const subject = 'Bem-vindo ao Alidash'
          const body = `<h1>Bem-vindo${name ? `, ${name}` : ''}</h1><p>Sua conta foi criada com sucesso. Aproveite o Alidash.</p>`
          await fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: data.user.id,
              email: {
                to: email.trim(),
                subject,
                body,
                type: 'welcome'
              }
            })
          })
        } catch {}
        try {
          const { data: sessionData } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
          })
          if (!sessionData?.session) {
            routerRef.current.push('/login')
          }
        } catch {
          routerRef.current.push('/login')
        }
      } else if (data.session) {
        toast.success('Cadastro realizado com sucesso!')
        try {
          const subject = 'Bem-vindo ao Alidash'
          const body = `<h1>Bem-vindo${name ? `, ${name}` : ''}</h1><p>Sua conta foi criada com sucesso. Aproveite o Alidash.</p>`
          await fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: data.user?.id,
              email: {
                to: email.trim(),
                subject,
                body,
                type: 'welcome'
              }
            })
          })
        } catch {}
      }

    } catch (error) {
      console.error('Erro no cadastro:', error)
      
      if (error instanceof Error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('rate limit') || msg.includes('too many requests')) {
          toast.error('Muitas tentativas de envio de email. Aguarde alguns minutos e tente novamente')
        } else if (error.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado')
        } else if (error.message.includes('Password should be at least')) {
          toast.error('A senha deve ter pelo menos 6 caracteres')
        } else if (error.message.includes('Unable to validate email address')) {
          toast.error('Email inválido')
        } else {
          toast.error('Erro ao criar conta. Tente novamente')
        }
      } else {
        toast.error('Erro inesperado ao criar conta')
      }
      
      throw error
    } finally {
      signUpInProgressRef.current = false
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch {}
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      clearSessionTimer()
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(SESSION_LOGIN_AT_KEY)
        }
      } catch {}
      setUser(null)
      setSession(null)
      routerRef.current.push('/login')
      toast.success('Logout realizado com sucesso!')
      
    } catch (error) {
      console.error('Erro no logout:', error)
      try {
        clearSessionTimer()
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(SESSION_LOGIN_AT_KEY)
        }
      } catch {}
      setUser(null)
      setSession(null)
      routerRef.current.push('/login')
      toast.error('Erro ao fazer logout')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const trimmed = email.trim()
      const now = Date.now()
      if (resetInProgressRef.current) {
        toast.error('Aguarde alguns segundos e tente novamente')
        return
      }
      if (lastResetAttemptRef.current && lastResetAttemptRef.current.email === trimmed) {
        const elapsed = now - lastResetAttemptRef.current.at
        if (elapsed < PASSWORD_RESET_COOLDOWN_MS) {
          const remainingMs = PASSWORD_RESET_COOLDOWN_MS - elapsed
          const remainingMin = Math.max(1, Math.ceil(remainingMs / 60000))
          toast.error(`Solicitação recente. Tente novamente em ${remainingMin} min`)
          return
        }
      }
      resetInProgressRef.current = true
      setLoading(true)
      
      const baseUrl = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
        : (process.env.NEXT_PUBLIC_APP_URL || '')
      const redirectTo = baseUrl ? `${baseUrl}/reset-password` : undefined

      let serverErrorCode: string | null = null
      try {
        const resp = await fetch('/api/auth/admin-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed, redirectTo })
        })
        if (resp.ok) {
          lastResetAttemptRef.current = { email: trimmed, at: now }
          toast.success('Se existir uma conta com este email, enviaremos o link de recuperação')
          return
        }
        if (resp.status === 429) {
          lastResetAttemptRef.current = { email: trimmed, at: now }
          toast.error('Muitas solicitações. Tente novamente em alguns minutos')
          return
        }
        const json = await resp.json().catch(() => ({} as any))
        serverErrorCode = String(json?.error || '').trim() || null
        if (serverErrorCode) {
          if (serverErrorCode === 'email_domain_not_verified') {
            toast.error('Erro no envio: domínio do remetente não verificado')
            return
          }
          if (serverErrorCode === 'email_api_key_invalid' || serverErrorCode === 'email_not_configured') {
            toast.error('Serviço de email não configurado corretamente')
            return
          }
          if (serverErrorCode === 'password_reset_unavailable') {
            toast.error('Serviço de recuperação indisponível. Tente novamente mais tarde')
            return
          }
        }
      } catch {}

      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo })
      if (error) {
        const msg = String(error.message || '').toLowerCase()
        if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('exceeded')) {
          lastResetAttemptRef.current = { email: trimmed, at: now }
          toast.error('Muitas solicitações. Verifique seu email e tente novamente em alguns minutos')
          return
        }
        throw error
      }

      lastResetAttemptRef.current = { email: trimmed, at: now }
      toast.success('Se existir uma conta com este email, enviaremos o link de recuperação')
      
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('Unable to validate email address')) {
          toast.error('Email inválido')
        } else {
          toast.error('Erro ao enviar email de recuperação')
        }
      } else {
        toast.error('Erro inesperado')
      }
      return
    } finally {
      resetInProgressRef.current = false
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword
  }

  // Show loading state during initial hydration
  if (!isHydrated) {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </AuthContext.Provider>
    )
  }

  // Show loading state after hydration
  // Após hidratação, não bloquear a UI com overlay global.
  // As páginas gerenciam seus próprios loaders usando `loading` do contexto.

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

// Export for backward compatibility
export const useSupabaseAuth = useAuth
