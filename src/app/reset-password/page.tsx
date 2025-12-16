'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-service'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [validRecovery, setValidRecovery] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidRecovery(true)
      }
    })
    return () => {
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
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        toast.error('Erro ao redefinir senha')
        return
      }
      toast.success('Senha alterada com sucesso!')
      router.push('/login')
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
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground rounded-md px-3 py-2"
          >
            {loading ? 'Salvando...' : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}

