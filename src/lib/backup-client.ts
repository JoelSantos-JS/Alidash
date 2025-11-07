import { supabase } from '@/lib/supabase-service'

export interface BackupData {
  userId: string
  products?: any[]
  dreams?: any[]
  bets?: any[]
  lastSync: Date
}

export interface SupabaseUser {
  id: string
  email?: string
}

/**
 * Faz backup dos dados do usuário atual
 */
export async function backupUserData(user: SupabaseUser): Promise<BackupData> {
  if (!user) {
    throw new Error('Usuário não autenticado')
  }

  try {
    
    // Buscar produtos do usuário
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)

    // Buscar goals (dreams) do usuário
    const { data: dreams } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)

    // Buscar apostas (se existir tabela)
    let bets: any[] = []
    try {
      const { data: betsData } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
      bets = betsData || []
    } catch {
      bets = [] // Se tabela não existir, retorna array vazio
    }

    const backupData: BackupData = {
      userId: user.id,
      products: products || [],
      dreams: dreams || [],
      bets: bets,
      lastSync: new Date()
    }

    // Enviar para API do Supabase
    const response = await fetch('/api/backup/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backupData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao salvar backup')
    }

    return backupData

  } catch (error: any) {
    console.error('Erro no backup:', error)
    throw error
  }
}

/**
 * Verifica status do último backup
 */
export async function getBackupStatus(userId: string) {
  try {
    const response = await fetch(`/api/backup/save?userId=${userId}`)
    
    if (!response.ok) {
      return { exists: false, lastSync: null, itemCounts: null }
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao verificar status do backup:', error)
    return { exists: false, lastSync: null, itemCounts: null }
  }
}