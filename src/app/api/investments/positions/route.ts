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
    const classFilter = searchParams.get("class") as
      | "stock"
      | "fii"
      | "etf"
      | "fixed_income"
      | "crypto"
      | null
    const accountId = searchParams.get("account_id")

    if (!userId) {
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }

    let query = supabase
      .from("investment_positions")
      .select("*")
      .eq("user_id", userId)

    if (accountId) {
      query = query.eq("account_id", accountId)
    }

    const { data: positions, error: posError } = await query

    if (posError) {
      return NextResponse.json({ error: posError.message }, { status: 500 })
    }

    const assetIds = Array.from(new Set((positions || []).map(p => p.asset_id).filter(Boolean)))

    const { data: assets } = await supabase
      .from("investment_assets")
      .select("id,ticker,name,class")
      .in("id", assetIds.length ? assetIds : ["00000000-0000-0000-0000-000000000000"])

    const { data: prices } = await supabase
      .from("investment_prices")
      .select("asset_id,date,close")
      .in("asset_id", assetIds.length ? assetIds : ["00000000-0000-0000-0000-000000000000"])
      .order("date", { ascending: false })

    const latestPriceByAsset: Record<string, number> = {}
    if (prices) {
      for (const row of prices) {
        const id = row.asset_id as string
        if (!(id in latestPriceByAsset)) {
          latestPriceByAsset[id] = Number(row.close)
        }
      }
    }

    const assetMap = new Map((assets || []).map(a => [a.id, a]))

    let filteredPositions = positions || []
    if (classFilter && ["stock", "fii", "etf", "fixed_income", "crypto"].includes(classFilter)) {
      filteredPositions = filteredPositions.filter(p => {
        const asset = assetMap.get(p.asset_id)
        return asset?.class === classFilter
      })
    }

    const result = filteredPositions.map(p => {
      const asset = assetMap.get(p.asset_id)
      const marketPrice = latestPriceByAsset[p.asset_id] ?? Number(p.avg_price) ?? 0
      const quantity = Number(p.quantity) || 0
      const avgPrice = Number(p.avg_price) || 0
      const marketValue = quantity * marketPrice
      return {
        assetId: p.asset_id,
        accountId: p.account_id,
        ticker: asset?.ticker || "",
        name: asset?.name || "",
        class: asset?.class || "stock",
        quantity,
        avgPrice,
        marketPrice,
        marketValue
      }
    })

    return NextResponse.json({ positions: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
