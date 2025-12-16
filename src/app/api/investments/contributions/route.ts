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
