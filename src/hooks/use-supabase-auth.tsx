'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, supabaseService } from '@/lib/supabase-service'
import { toast } from 'sonner'
import { LoaderCircle } from 'lucide-react'

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

  // Prevent hydration mismatch by ensuring consistent initial state
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    console.log('🔧 AuthProvider useEffect iniciado')
    
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

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await ensureUserInDatabase(session.user)
            await supabaseService.updateUserLastLogin(session.user.id)
            router.push('/')
            toast.success('Login realizado com sucesso!')
          } catch (error) {
            console.error('Erro pós-login:', error)
            toast.error('Erro ao finalizar login')
            // Não impedir o login por causa de erros de sincronização
          }
        } else if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
        
        // Garantir que loading seja sempre false após mudanças de estado
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

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
      setLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name?.trim() || null,
            full_name: name?.trim() || null
          }
        }
      })

      if (error) {
        throw error
      }

      if (data.user && !data.session) {
        // User needs to confirm email
        toast.success('Cadastro realizado! Verifique seu email para confirmar a conta')
        router.push('/login')
      } else if (data.session) {
        // Auto-signed in (email confirmation disabled)
        toast.success('Cadastro realizado com sucesso!')
      }

    } catch (error) {
      console.error('Erro no cadastro:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
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
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }

      toast.success('Logout realizado com sucesso!')
      
    } catch (error) {
      console.error('Erro no logout:', error)
      toast.error('Erro ao fazer logout')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw error
      }

      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada')
      
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
      
      throw error
    } finally {
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
  if (!isHydrated || loading) {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </AuthContext.Provider>
    )
  }

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