import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminService } from '@/lib/supabase-service'

export async function POST(request: NextRequest) {
  try {
    const { user_id, email } = await request.json()

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error: 'user_id é obrigatório e deve ser uma string válida' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo ID
    let user = await supabaseAdminService.getUserById(user_id)
    
    // Fallback: buscar por email se não encontrado
    if (!user && email) {
      try {
        user = await supabaseAdminService.getUserByEmail(email)
      } catch {}
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const isPaid = user.account_type === 'pro' || user.account_type === 'basic'
    if (isPaid) {
      const nowIso = new Date().toISOString()
      const startedAt = user.plan_started_at || nowIso

      const existingNext = user.plan_next_renewal_at ? new Date(String(user.plan_next_renewal_at)) : null
      const hasParsableExistingNext = !!existingNext && !Number.isNaN(existingNext.getTime())
      const graceMs = 2 * 24 * 60 * 60 * 1000
      const isExpired = hasParsableExistingNext && (existingNext!.getTime() + graceMs) <= Date.now()

      if (isExpired) {
        const client = supabaseAdminService.getClient()
        const { data: updated } = await client
          .from('users')
          .update({
            account_type: 'personal',
            plan_status: 'expired',
            plan_price_brl: null
          })
          .eq('id', user.id)
          .select('*')
          .single()

        if (updated) {
          user = updated
        } else {
          user = {
            ...user,
            account_type: 'personal',
            plan_status: 'expired',
            plan_price_brl: null
          }
        }
      }
      if (!isExpired) {
        const planStatus = user.plan_status || 'active'
        const planPriceBrl = user.plan_price_brl || (user.account_type === 'basic' ? 19 : 27)

        const shouldBackfillNextRenewal =
          !user.plan_next_renewal_at || (user.plan_next_renewal_at && !hasParsableExistingNext)
        const nextRenewalAt = shouldBackfillNextRenewal
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : existingNext!.toISOString()

        const needsPlanBackfill =
          !user.plan_next_renewal_at || !user.plan_started_at || !user.plan_status || !user.plan_price_brl

        if (needsPlanBackfill) {
          const client = supabaseAdminService.getClient()
          const { data: updated } = await client
            .from('users')
            .update({
              plan_started_at: startedAt,
              plan_next_renewal_at: nextRenewalAt,
              plan_status: planStatus,
              plan_price_brl: planPriceBrl
            })
            .eq('id', user.id)
            .select('*')
            .single()

          if (updated) {
            user = updated
          } else {
            user = {
              ...user,
              plan_started_at: startedAt,
              plan_next_renewal_at: nextRenewalAt,
              plan_status: planStatus,
              plan_price_brl: planPriceBrl
            }
          }
        }
      }
    }

    // Retornar dados completos do usuário
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        account_type: user.account_type || 'personal',
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        is_active: user.is_active,
        plan_next_renewal_at: user.plan_next_renewal_at || null,
        plan_started_at: user.plan_started_at || null,
        plan_status: user.plan_status || null,
        plan_price_brl: user.plan_price_brl || null
      }
    })

  } catch (error) {
    console.error('Erro na API de busca de usuário:', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
