import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import { User } from 'firebase/auth'

export interface BackupData {
  userId: string
  products?: any[]
  dreams?: any[]
  bets?: any[]
  lastSync: Date
}

/**
 * Faz backup dos dados do usuário atual
 */
export async function backupUserData(user: User): Promise<BackupData> {
  if (!user) {
    throw new Error('Usuário não autenticado')
  }

  try {
    // Buscar dados do Firebase (com autenticação do usuário)
    const userDocRef = doc(db, 'user-data', user.uid)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      throw new Error('Dados do usuário não encontrados')
    }

    const userData = userDocSnap.data()

    const backupData: BackupData = {
      userId: user.uid,
      products: userData.products || [],
      dreams: userData.dreams || [],
      bets: userData.bets || [],
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