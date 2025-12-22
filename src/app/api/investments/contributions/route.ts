"use server"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const monthsParam = searchParams.get("months")
    const accountId = searchParams.get("account_id")
    const classFilter = searchParams.get("class") as
      | "stock"
      | "fii"
      | "etf"
      | "fixed_income"
      | "crypto"
      | null

    if (!userId) {
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    const months = Math.max(1, Math.min(24, Number(monthsParam) || 12))

    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

    let txQuery = supabase
      .from("investment_transactions")
      .select("date,type,quantity,unit_price,fees,taxes,cash_flow,asset_id,account_id")
      .eq("user_id", userId)
      .eq("type", "buy")
      .gte("date", from.toISOString())
      .order("date", { ascending: true })

    if (accountId) {
      txQuery = txQuery.eq("account_id", accountId)
    }

    const { data: tx, error } = await txQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let filtered = tx || []
    if (classFilter && ["stock", "fii", "etf", "fixed_income", "crypto"].includes(classFilter)) {
      const assetIds = Array.from(
        new Set(filtered.map(r => r.asset_id).filter(Boolean) as string[])
      )
      const { data: assets } = await supabase
        .from("investment_assets")
        .select("id,class")
        .in("id", assetIds.length ? assetIds : ["00000000-0000-0000-0000-000000000000"])
      const classMap = new Map((assets || []).map(a => [a.id, a.class]))
      filtered = filtered.filter(r => classMap.get(r.asset_id as string) === classFilter)
    }

    const byMonth: Record<string, number> = {}

    for (const row of filtered) {
      const d = new Date(row.date as string)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const qty = Number(row.quantity) || 0
      const unit = Number(row.unit_price) || 0
      const fees = Number(row.fees) || 0
      const taxes = Number(row.taxes) || 0
      const cf = Number(row.cash_flow) || 0
      const amount = cf !== 0 ? Math.abs(cf) : qty * unit + fees + taxes
      byMonth[key] = (byMonth[key] || 0) + amount
    }

    const monthsList: { month: string; total: number }[] = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthsList.push({ month: key, total: byMonth[key] || 0 })
    }

    return NextResponse.json({ contributions: monthsList })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      asset_id,
      ticker,
      asset_class,
      account_id,
      quantity,
      unit_price,
      fees = 0,
      taxes = 0,
      date,
      notes
    } = body || {}

    if (!user_id) {
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }
    const qty = Number(quantity)
    const unit = Number(unit_price)
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unit) || unit <= 0) {
      return NextResponse.json({ error: "quantity e unit_price devem ser positivos" }, { status: 400 })
    }
    const dt = date ? new Date(date) : new Date()

    let usedAssetId = asset_id as string | undefined
    if (!usedAssetId) {
      if (!ticker || !asset_class) {
        return NextResponse.json({ error: "Informe ticker e asset_class quando asset_id não for fornecido" }, { status: 400 })
      }
      const { data: existingAssets, error: findErr } = await supabase
        .from("investment_assets")
        .select("id,ticker")
        .eq("ticker", String(ticker).toUpperCase())
        .limit(1)
      if (findErr) {
        return NextResponse.json({ error: findErr.message }, { status: 500 })
      }
      if (existingAssets && existingAssets.length > 0) {
        usedAssetId = existingAssets[0].id as string
      } else {
        const { data: created, error: createErr } = await supabase
          .from("investment_assets")
          .insert({
            ticker: String(ticker).toUpperCase(),
            name: String(ticker).toUpperCase(),
            class: asset_class
          })
          .select("id")
          .single()
        if (createErr) {
          return NextResponse.json({ error: createErr.message }, { status: 500 })
        }
        usedAssetId = created?.id as string
      }
    }

    const safeFees = Number(fees) || 0
    const safeTaxes = Number(taxes) || 0
    const total = qty * unit + safeFees + safeTaxes
    const cashFlow = -Math.abs(total)

    const insertPayload = {
      user_id,
      asset_id: usedAssetId!,
      account_id: account_id || null,
      type: "buy",
      quantity: qty,
      unit_price: unit,
      fees: safeFees,
      taxes: safeTaxes,
      cash_flow: cashFlow,
      date: dt.toISOString(),
      notes: notes || null
    }

    const { data: inserted, error: insErr } = await supabase
      .from("investment_transactions")
      .insert(insertPayload)
      .select("*")
      .single()

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, contribution: inserted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
