import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const monthParam = searchParams.get('month')
    const yearParam = searchParams.get('year')

    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    let query = supabase
      .from('personal_budgets')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (monthParam && yearParam) {
      const month = parseInt(monthParam)
      const year = parseInt(yearParam)
      if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
        query = query.eq('month', month).eq('year', year)
      }
    }

    const { data: budgets, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar orçamentos', details: error.message }, { status: 500 })
    }

    const first = budgets && budgets[0] ? budgets[0] : null
    const totalBudget =
      first?.total_budget ??
      (first?.categories
        ? Object.values(first.categories).reduce((acc: number, v: any) => acc + (typeof v === 'number' ? v : Number(v) || 0), 0)
        : 0)

    return NextResponse.json({
      budgets: budgets || [],
      summary: {
        totalBudget
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno do servidor', details: err?.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, month, year, total_budget, categories, name, notes } = body || {}

    if (!user_id || !month || !year) {
      return NextResponse.json({ error: 'user_id, month e year são obrigatórios' }, { status: 400 })
    }
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'month deve estar entre 1 e 12' }, { status: 400 })
    }
    const tb = typeof total_budget === 'number' ? total_budget : Number(total_budget || 0)
    const cats = categories && typeof categories === 'object' ? categories : null

    const { data: existing } = await supabase
      .from('personal_budgets')
      .select('id')
      .eq('user_id', user_id)
      .eq('month', month)
      .eq('year', year)
      .single()

    const payload: any = {
      user_id,
      month,
      year,
      name: name || `Orçamento ${month}/${year}`,
      total_budget: tb,
      categories: cats,
      notes: notes || null,
      status: 'active',
      updated_at: new Date().toISOString()
    }

    let result
    if (existing?.id) {
      const { data, error } = await supabase
        .from('personal_budgets')
        .update(payload)
        .eq('id', existing.id)
        .select('*')
        .single()
      if (error) {
        return NextResponse.json({ error: 'Erro ao atualizar orçamento', details: error.message }, { status: 500 })
      }
      result = data
    } else {
      const { data, error } = await supabase
        .from('personal_budgets')
        .insert([{ ...payload, created_at: new Date().toISOString() }])
        .select('*')
        .single()
      if (error) {
        return NextResponse.json({ error: 'Erro ao criar orçamento', details: error.message }, { status: 500 })
      }
      result = data
    }

    return NextResponse.json({
      budget: result,
      summary: {
        totalBudget: result?.total_budget ?? (result?.categories ? Object.values(result.categories).reduce((acc: number, v: any) => acc + (typeof v === 'number' ? v : Number(v) || 0), 0) : 0)
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno do servidor', details: err?.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, month, year, total_budget, categories, name, notes, status } = body || {}

    if (!user_id || !month || !year) {
      return NextResponse.json({ error: 'user_id, month e year são obrigatórios' }, { status: 400 })
    }
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'month deve estar entre 1 e 12' }, { status: 400 })
    }

    const payload: any = {
      total_budget: typeof total_budget === 'number' ? total_budget : Number(total_budget || 0),
      categories: categories && typeof categories === 'object' ? categories : null,
      name: name || `Orçamento ${month}/${year}`,
      notes: notes || null,
      status: status || 'active',
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('personal_budgets')
      .update(payload)
      .eq('user_id', user_id)
      .eq('month', month)
      .eq('year', year)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar orçamento', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      budget: data,
      summary: {
        totalBudget: data?.total_budget ?? (data?.categories ? Object.values(data.categories).reduce((acc: number, v: any) => acc + (typeof v === 'number' ? v : Number(v) || 0), 0) : 0)
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro interno do servidor', details: err?.message }, { status: 500 })
  }
}
