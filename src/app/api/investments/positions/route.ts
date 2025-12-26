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

    const cryptoAssetsNeedingPrice = filteredPositions
      .filter(p => {
        const a = assetMap.get(p.asset_id)
        return a?.class === "crypto" && latestPriceByAsset[p.asset_id] === undefined
      })
      .map(p => p.asset_id)
    if (cryptoAssetsNeedingPrice.length > 0) {
      try {
        const coinListRes = await fetch("https://api.coingecko.com/api/v3/coins/list?include_platform=false")
        if (coinListRes.ok) {
          const coins: Array<{ id: string; symbol: string; name: string }> = await coinListRes.json()
          const normalize = (s: string) =>
            String(s || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]/g, "")
          const idByAsset = new Map<string, string>()
          for (const assetId of cryptoAssetsNeedingPrice) {
            const a = assetMap.get(assetId)
            const sym = normalize(a?.ticker || "")
            const nm = normalize(a?.name || "")
            let match =
              coins.find(c => normalize(c.symbol) === sym) ||
              coins.find(c => normalize(c.id) === sym) ||
              coins.find(c => normalize(c.name) === nm)
            if (match) {
              idByAsset.set(assetId, match.id)
            }
          }
          const ids = Array.from(new Set(Array.from(idByAsset.values())))
          if (ids.length > 0) {
            const pricesRes = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=brl`
            )
            if (pricesRes.ok) {
              const priceData = await pricesRes.json()
              for (const [assetId, cgId] of idByAsset) {
                const v = priceData?.[cgId]?.brl
                if (v !== undefined && v !== null) {
                  latestPriceByAsset[assetId] = Number(v)
                }
              }
            }
          }
        }
      } catch {}
    }

    const result = filteredPositions.map(p => {
      const asset = assetMap.get(p.asset_id)
      const marketPrice = latestPriceByAsset[p.asset_id] ?? Number(p.avg_price) ?? 0
      const quantity = Number(p.quantity) || 0
      const avgPrice = Number(p.avg_price) || 0
      const marketValue = quantity * marketPrice
      return {
        id: p.id,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      asset_id,
      ticker,
      name,
      class: assetClass,
      account_id,
      quantity,
      avg_price
    } = body || {}

    if (!user_id) {
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }
    let usedAssetId = asset_id as string | undefined
    if (!usedAssetId) {
      if (!ticker || !assetClass) {
        return NextResponse.json({ error: "Informe ticker e class quando asset_id não for fornecido" }, { status: 400 })
      }
      const { data: existing, error: findErr } = await supabase
        .from("investment_assets")
        .select("id,ticker")
        .eq("ticker", String(ticker).toUpperCase())
        .limit(1)
      if (findErr) {
        return NextResponse.json({ error: findErr.message }, { status: 500 })
      }
      if (existing && existing.length > 0) {
        usedAssetId = existing[0].id as string
      } else {
        const { data: created, error: createErr } = await supabase
          .from("investment_assets")
          .insert({
            ticker: String(ticker).toUpperCase(),
            name: name || String(ticker).toUpperCase(),
            class: assetClass
          })
          .select("id")
          .single()
        if (createErr) {
          return NextResponse.json({ error: createErr.message }, { status: 500 })
        }
        usedAssetId = created?.id as string
      }
    }

    const qty = Number(quantity)
    const avg = Number(avg_price)
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(avg) || avg <= 0) {
      return NextResponse.json({ error: "quantity e avg_price devem ser positivos" }, { status: 400 })
    }

    const { data: position, error: posErr } = await supabase
      .from("investment_positions")
      .insert({
        user_id,
        asset_id: usedAssetId!,
        account_id: account_id || null,
        quantity: qty,
        avg_price: avg
      })
      .select("*")
      .single()

    if (posErr) {
      return NextResponse.json({ error: posErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, position })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, position_id, quantity, avg_price, account_id } = body || {}
    if (!user_id || !position_id) {
      return NextResponse.json({ error: "user_id e position_id são obrigatórios" }, { status: 400 })
    }
    const updatePayload: any = {}
    if (quantity !== undefined) {
      const q = Number(quantity)
      if (!Number.isFinite(q) || q <= 0) {
        return NextResponse.json({ error: "quantity deve ser positivo" }, { status: 400 })
      }
      updatePayload.quantity = q
    }
    if (avg_price !== undefined) {
      const a = Number(avg_price)
      if (!Number.isFinite(a) || a <= 0) {
        return NextResponse.json({ error: "avg_price deve ser positivo" }, { status: 400 })
      }
      updatePayload.avg_price = a
    }
    if (account_id !== undefined) {
      updatePayload.account_id = account_id || null
    }
    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }
    const { data, error } = await supabase
      .from("investment_positions")
      .update(updatePayload)
      .eq("id", position_id)
      .eq("user_id", user_id)
      .select("*")
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, position: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, position_id } = body || {}
    if (!user_id || !position_id) {
      return NextResponse.json({ error: "user_id e position_id são obrigatórios" }, { status: 400 })
    }
    const { data, error } = await supabase
      .from("investment_positions")
      .delete()
      .eq("id", position_id)
      .eq("user_id", user_id)
      .select("*")
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, deleted: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
