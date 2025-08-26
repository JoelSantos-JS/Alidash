import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore'
import { generateApiKey, N8NApiKey, N8N_PERMISSIONS } from '@/lib/n8n-auth'
import { auth } from '@/lib/firebase'
import { getAuth } from 'firebase-admin/auth'

/**
 * POST - Criar nova API key para N8N
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    const { userId, permissions, description, expiresInDays } = await request.json()

    if (!userId) {
      console.warn(`N8N API Key creation attempt without userId from IP: ${clientIP}`)
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    if (!permissions || !Array.isArray(permissions)) {
      console.warn(`N8N API Key creation attempt with invalid permissions from user ${userId}, IP: ${clientIP}`)
      return NextResponse.json({ error: 'permissions deve ser um array' }, { status: 400 })
    }

    // Validar permissões
    const validPermissions = Object.values(N8N_PERMISSIONS)
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
    
    if (invalidPermissions.length > 0) {
      console.warn(`N8N API Key creation attempt with invalid permissions: ${invalidPermissions.join(', ')} from user ${userId}, IP: ${clientIP}`)
      return NextResponse.json({ 
        error: `Permissões inválidas: ${invalidPermissions.join(', ')}` 
      }, { status: 400 })
    }

    // Gerar nova API key
    const apiKey = generateApiKey()
    const now = new Date()
    const expiresAt = expiresInDays ? new Date(now.getTime() + (expiresInDays * 24 * 60 * 60 * 1000)) : null

    const keyData: N8NApiKey = {
      userId,
      apiKey,
      permissions,
      createdAt: now,
      expiresAt: expiresAt || new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)), // 1 ano por padrão
      isActive: true,
      description: description || 'API Key para N8N'
    }

    // Salvar no Firebase
    await setDoc(doc(db, 'n8n-api-keys', apiKey), keyData)

    // Log de segurança
    console.log(`N8N API Key created successfully for user ${userId} with permissions: ${permissions.join(', ')}`)

    return NextResponse.json({
      success: true,
      apiKey,
      permissions,
      expiresAt: keyData.expiresAt,
      description: keyData.description
    })

  } catch (error) {
    console.error('Erro ao criar API key:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * GET - Listar API keys de um usuário
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    // Buscar todas as API keys do usuário
    const keysQuery = query(
      collection(db, 'n8n-api-keys'),
      where('userId', '==', userId)
    )
    
    const querySnapshot = await getDocs(keysQuery)
    const apiKeys = querySnapshot.docs.map(doc => {
      const data = doc.data() as N8NApiKey
      return {
        id: doc.id,
        permissions: data.permissions,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
        isActive: data.isActive,
        lastUsed: data.lastUsed,
        description: data.description,
        // Não retornar a API key completa por segurança
        apiKeyPreview: data.apiKey.substring(0, 8) + '...'
      }
    })

    return NextResponse.json({ apiKeys })

  } catch (error) {
    console.error('Erro ao listar API keys:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * DELETE - Revogar uma API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const { apiKey, userId } = await request.json()

    if (!apiKey || !userId) {
      return NextResponse.json({ error: 'apiKey e userId são obrigatórios' }, { status: 400 })
    }

    // Verificar se a API key existe e pertence ao usuário
    const keyDoc = await getDoc(doc(db, 'n8n-api-keys', apiKey))
    
    if (!keyDoc.exists()) {
      return NextResponse.json({ error: 'API key não encontrada' }, { status: 404 })
    }

    const keyData = keyDoc.data() as N8NApiKey
    
    if (keyData.userId !== userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Deletar a API key
    await deleteDoc(doc(db, 'n8n-api-keys', apiKey))

    return NextResponse.json({ success: true, message: 'API key revogada com sucesso' })

  } catch (error) {
    console.error('Erro ao revogar API key:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}