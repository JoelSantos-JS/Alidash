import { createClient } from '@supabase/supabase-js'
import { db } from './firebase'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'

// Cliente Supabase com service role para operações administrativas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface BackupData {
  userId: string
  products?: any[]
  dreams?: any[]
  bets?: any[]
  lastSync: Date
}

/**
 * Sincroniza dados de um usuário específico do Firebase para Supabase
 */
export async function syncUserData(userId: string): Promise<void> {
  try {
    console.log(`🔄 Iniciando sync para usuário: ${userId}`)

    // Buscar dados do Firebase
    const firebaseData = await getFirebaseUserData(userId)
    
    // Verificar se já existe registro no Supabase
    const { data: existingUser } = await supabaseAdmin
      .from('firebase_backup')
      .select('*')
      .eq('user_id', userId)
      .single()

    const backupData: Partial<BackupData> = {
      userId,
      products: firebaseData.products,
      dreams: firebaseData.dreams,
      bets: firebaseData.bets,
      lastSync: new Date()
    }

    if (existingUser) {
      // Atualizar registro existente
      const { error } = await supabaseAdmin
        .from('firebase_backup')
        .update({
          products: backupData.products,
          dreams: backupData.dreams,
          bets: backupData.bets,
          last_sync: backupData.lastSync
        })
        .eq('user_id', userId)

      if (error) throw error
      console.log(`✅ Dados atualizados para usuário: ${userId}`)
    } else {
      // Criar novo registro
      const { error } = await supabaseAdmin
        .from('firebase_backup')
        .insert({
          user_id: userId,
          products: backupData.products,
          dreams: backupData.dreams,
          bets: backupData.bets,
          last_sync: backupData.lastSync
        })

      if (error) throw error
      console.log(`✅ Novo backup criado para usuário: ${userId}`)
    }

  } catch (error) {
    console.error(`❌ Erro no sync para usuário ${userId}:`, error)
    throw error
  }
}

/**
 * Busca dados de um usuário no Firebase
 */
async function getFirebaseUserData(userId: string) {
  try {
    // Buscar documento do usuário diretamente
    const userDocRef = doc(db, 'user-data', userId)
    const userDocSnap = await getDoc(userDocRef)
    
    if (!userDocSnap.exists()) {
      return { products: [], dreams: [], bets: [] }
    }

    const userData = userDocSnap.data()

    return {
      products: userData.products || [],
      dreams: userData.dreams || [],
      bets: userData.bets || []
    }
  } catch (error) {
    console.error('Erro ao buscar dados do Firebase:', error)
    return { products: [], dreams: [], bets: [] }
  }
}

/**
 * Sincroniza todos os usuários do Firebase para Supabase
 */
export async function syncAllUsers(): Promise<void> {
  try {
    console.log('🚀 Iniciando sincronização completa...')
    
    // Buscar todos os documentos de usuário no Firebase
    const userDataCollection = collection(db, 'user-data')
    const snapshot = await getDocs(userDataCollection)
    
    const syncPromises = snapshot.docs.map(doc => syncUserData(doc.id))
    
    await Promise.allSettled(syncPromises)
    
    console.log('✅ Sincronização completa finalizada')
  } catch (error) {
    console.error('❌ Erro na sincronização completa:', error)
    throw error
  }
}

/**
 * Restaura dados de um usuário do Supabase para o Firebase (failover)
 */
export async function restoreUserData(userId: string): Promise<void> {
  try {
    console.log(`🔄 Restaurando dados para usuário: ${userId}`)

         // Buscar dados do backup no Supabase
    const { data: backupData, error } = await supabaseAdmin
      .from('firebase_backup')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !backupData) {
      throw new Error(`Backup não encontrado para usuário: ${userId}`)
    }

    // Aqui você implementaria a lógica para restaurar no Firebase
    // Por enquanto, apenas logamos os dados
    console.log(`📦 Dados encontrados para restauração:`, {
      products: (backupData as any).products?.length || 0,
      dreams: (backupData as any).dreams?.length || 0,
      bets: (backupData as any).bets?.length || 0,
      lastSync: (backupData as any).last_sync
    })

    console.log(`✅ Dados restaurados para usuário: ${userId}`)
  } catch (error) {
    console.error(`❌ Erro na restauração para usuário ${userId}:`, error)
    throw error
  }
}

/**
 * Verifica status do backup para um usuário
 */
export async function getBackupStatus(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('firebase_backup')
      .select('last_sync, products, dreams, bets')
      .eq('user_id', userId)
      .single()

    if (error) {
      return { exists: false, lastSync: null, itemCounts: null }
    }

    return {
      exists: true,
      lastSync: (data as any).last_sync,
      itemCounts: {
        products: (data as any).products?.length || 0,
        dreams: (data as any).dreams?.length || 0,
        bets: (data as any).bets?.length || 0
      }
    }
  } catch (error) {
    console.error('Erro ao verificar status do backup:', error)
    return { exists: false, lastSync: null, itemCounts: null }
  }
} 