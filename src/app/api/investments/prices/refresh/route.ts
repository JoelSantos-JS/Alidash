"use server"

import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-service"

async function fetchCryptoIdsBySymbol() {
  const res = await fetch("https://api.coingecko.com/api/v3/coins/list?include_platform=false", { cache: "no-store" })
  const list = await res.json().catch(() => [])
  const map: Record<string, string> = {}
  if (Array.isArray(list)) {
    for (const c of list) {
      const sym = String(c.symbol || "").toLowerCase()
      if (sym && !map[sym]) {
        map[sym] = String(c.id || "")
      }
    }
  }
  return map
}

async function fetchCryptoPricesBRL(ids: string[]) {
  if (!ids.length) return {}
  const unique = Array.from(new Set(ids.filter(Boolean)))
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(unique.join(","))}&vs_currencies=brl`
  const res = await fetch(url, { cache: "no-store" })
  const json = await res.json().catch(() => ({}))
  const out: Record<string, number> = {}
  for (const key of Object.keys(json || {})) {
    const brl = Number(json[key]?.brl)
    if (Number.isFinite(brl)) out[key] = brl
  }
  return out
}

async function fetchBrapiQuotes(tickers: string[], token?: string) {
  if (!tickers.length) return {}
  const unique = Array.from(new Set(tickers.filter(Boolean)))
  const base = `https://brapi.dev/api/quote/${encodeURIComponent(unique.join(","))}`
  const url = token ? `${base}?token=${encodeURIComponent(token)}` : base
  const res = await fetch(url, { cache: "no-store" })
  const json = await res.json().catch(() => ({}))
  const out: Record<string, number> = {}
  const results = Array.isArray(json?.results) ? json.results : []
  for (const r of results) {
    const sym = String(r.symbol || "").toUpperCase()
    const close = Number(r?.regularMarketPrice ?? r?.close)
    if (sym && Number.isFinite(close)) out[sym] = close
  }
  return out
}

export async function POST(request: NextRequest) {
  try {
    const admin = supabaseAdmin!
    const { data: assets, error: assetsErr } = await admin
      .from("investment_assets")
      .select("id,ticker,class")

    if (assetsErr) {
      return NextResponse.json({ error: assetsErr.message }, { status: 500 })
    }

    const nowIso = new Date().toISOString()
    const cryptoAssets = (assets || []).filter(a => String(a.class) === "crypto")
    const equityAssets = (assets || []).filter(a => ["stock", "fii", "etf"].includes(String(a.class)))

    let updates: Array<{ asset_id: string; date: string; close: number }> = []

    if (cryptoAssets.length > 0) {
      const symbolMap = await fetchCryptoIdsBySymbol()
      const ids = cryptoAssets
        .map(a => symbolMap[String(a.ticker || "").toLowerCase()] || "")
        .filter(Boolean)
      const pricesById = await fetchCryptoPricesBRL(ids)
      const idBySymbol = Object.entries(symbolMap).reduce((acc, [sym, id]) => {
        acc[id] = sym
        return acc
      }, {} as Record<string, string>)
      for (const a of cryptoAssets) {
        const id = symbolMap[String(a.ticker || "").toLowerCase()]
        const brl = id ? pricesById[id] : undefined
        if (Number.isFinite(brl as number)) {
          updates.push({ asset_id: a.id as string, date: nowIso, close: brl as number })
        }
      }
    }

    const brapiToken = process.env.BRAPI_TOKEN
    if (equityAssets.length > 0) {
      const tickers = equityAssets.map(a => String(a.ticker || "").toUpperCase())
      const quotes = await fetchBrapiQuotes(tickers, brapiToken)
      for (const a of equityAssets) {
        const sym = String(a.ticker || "").toUpperCase()
        const close = quotes[sym]
        if (Number.isFinite(close)) {
          updates.push({ asset_id: a.id as string, date: nowIso, close })
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, updated: 0 })
    }

    const { error: upErr } = await admin
      .from("investment_prices")
      .insert(updates)

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated: updates.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro" }, { status: 500 })
  }
}
