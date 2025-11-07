'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-supabase-auth'
import { toast } from 'sonner'
import { ElectricVIcon } from '@/components/ui/electric-v-icon'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, resetPassword } = useAuth()
  const router = useRouter()

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email é obrigatório')
      return false
    }

    if (!email.includes('@')) {
      setError('Email inválido')
      return false
    }

    if (!password) {
      setError('Senha é obrigatória')
      return false
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)
      await signIn(email, password)
      // Success is handled by the auth context (redirect + toast)
    } catch (error) {
      console.error('Login error:', error)
      // Error toast is handled by the auth context
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error('Digite seu email primeiro')
      return
    }

    try {
      await resetPassword(email)
      // Success message is handled by the resetPassword function
    } catch (error) {
      // Error message is handled by the resetPassword function
      console.error('Erro ao enviar email de recuperação:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0e244a] via-[#1e3a8a] to-[#102a54] p-4">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center">
            <div className="rounded-full p-4 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_40px_rgba(37,99,235,0.35)] ring-1 ring-white/30">
              <ElectricVIcon className="h-10 w-10 text-white drop-shadow" />
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">VoxCash</h1>
          <p className="mt-1 text-white/80">Gestão Financeira Inteligente</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0b1f3e]/70 backdrop-blur-sm border border-white/15 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Bem-vindo de Volta!</h2>
            <p className="mt-1 text-primary">Faça login para acessar seu dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-400/50 text-white p-3 rounded-lg">
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-white font-medium block">E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-white/40 text-white placeholder:text-white/60 focus:border-white focus:ring-white/30 p-3 rounded-lg focus:outline-none focus:ring-2"
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-white font-medium block">Senha</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-white/40 text-white placeholder:text-white/60 focus:border-white focus:ring-white/30 p-3 rounded-lg focus:outline-none focus:ring-2"
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-white/80 text-sm hover:text-white hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px bg-white/20 flex-1" />
              <span className="text-white/60 text-sm">ou</span>
              <div className="h-px bg-white/20 flex-1" />
            </div>

            <div className="text-center">
              <span className="text-white/80 text-sm">
                Não tem uma conta?{' '}
                <Link href="/cadastro" className="text-white font-medium hover:underline">
                  Cadastre-se
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}