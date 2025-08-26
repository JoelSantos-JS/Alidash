import { NextRequest } from 'next/server'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import crypto from 'crypto'

export interface N8NApiKey {
  userId: string
  apiKey: string
  permissions: string[]
  createdAt: Date
  expiresAt: Date
  isActive: boolean
  lastUsed?: Date
  description?: string
}

export interface N8NAuthResult {
  success: boolean
  userId?: string
  permissions?: string[]
  error?: string
}

/**
 * Gera uma nova API key para N8N
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Valida uma API key do N8N
 */
export async function validateN8NApiKey(apiKey: string): Promise<N8NAuthResult> {
  try {
    if (!apiKey) {
      return { success: false, error: 'API key é obrigatória' }
    }

    // Buscar a API key no Firebase
    const apiKeyDoc = await getDoc(doc(db, 'n8n-api-keys', apiKey))
    
    if (!apiKeyDoc.exists()) {
      return { success: false, error: 'API key inválida' }
    }

    const keyData = apiKeyDoc.data() as N8NApiKey

    // Verificar se a key está ativa
    if (!keyData.isActive) {
      return { success: false, error: 'API key desativada' }
    }

    // Verificar se a key não expirou
    if (keyData.expiresAt && new Date() > keyData.expiresAt) {
      return { success: false, error: 'API key expirada' }
    }

    return {
      success: true,
      userId: keyData.userId,
      permissions: keyData.permissions
    }
  } catch (error) {
    console.error('Erro ao validar API key:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}

/**
 * Middleware para autenticação N8N
 */
export async function authenticateN8NRequest(request: NextRequest): Promise<N8NAuthResult> {
  const apiKey = request.headers.get('x-api-key') || 
                 request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  
  if (!apiKey) {
    return { success: false, error: 'API key não fornecida. Use o header x-api-key ou Authorization: Bearer <key>' }
  }

  // Validar formato da API key (deve ser hexadecimal de 64 caracteres)
  if (!/^[a-f0-9]{64}$/i.test(apiKey)) {
    return { success: false, error: 'Formato de API key inválido' }
  }

  return await validateN8NApiKey(apiKey)
}

/**
 * Verifica se o usuário tem permissão para uma ação específica
 */
export function hasPermission(permissions: string[], requiredPermission: string): boolean {
  return permissions.includes('admin') || permissions.includes(requiredPermission)
}

/**
 * Permissões disponíveis para N8N
 */
export const N8N_PERMISSIONS = {
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  GOALS_READ: 'goals:read',
  GOALS_WRITE: 'goals:write',
  TRANSACTIONS_READ: 'transactions:read',
  TRANSACTIONS_WRITE: 'transactions:write',
  ANALYTICS_READ: 'analytics:read',
  WEBHOOKS_MANAGE: 'webhooks:manage',
  ADMIN: 'admin'
} as const