"use client"

import { useState, useEffect } from 'react'

interface Goal {
  id: string
  name: string
  description: string
  currentValue: number
  targetValue: number
  unit: string
  category: string
  priority: string
  status: string
  deadline: string
}

export default function TestMetasPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadGoals() {
      try {
        const userId = 'd550e8ce-d151-4a33-9d8f-4f7cf8886c9b'
        console.log('🎯 Carregando metas para usuário:', userId)
        
        const response = await fetch(`/api/goals?user_id=${userId}`)
        console.log('📊 Status da resposta:', response.status)
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('📈 Dados recebidos:', data)
        
        if (data.success && data.goals) {
          setGoals(data.goals)
          console.log(`✅ ${data.goals.length} metas carregadas`)
        } else {
          setError('Nenhuma meta encontrada')
        }
        
      } catch (err) {
        console.error('❌ Erro ao carregar metas:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    
    loadGoals()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Teste da API de Metas</h1>
        <p>Carregando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Teste da API de Metas</h1>
        <p className="text-red-600">❌ Erro: {error}</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Teste da API de Metas</h1>
      <p className="text-green-600 mb-6">✅ {goals.length} metas carregadas com sucesso!</p>
      
      <div className="grid gap-4">
        {goals.map((goal) => (
          <div key={goal.id} className="border rounded-lg p-4 bg-white shadow">
            <h3 className="text-lg font-semibold mb-2">{goal.name}</h3>
            <p className="text-gray-600 mb-2">{goal.description || 'Sem descrição'}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><strong>Progresso:</strong> {goal.currentValue}/{goal.targetValue} {goal.unit}</p>
              <p><strong>Categoria:</strong> {goal.category}</p>
              <p><strong>Prioridade:</strong> {goal.priority}</p>
              <p><strong>Status:</strong> {goal.status}</p>
              <p><strong>Prazo:</strong> {goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}