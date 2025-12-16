"use server"

import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-service"

export async function GET() {
  try {
    const tables = [
      "investment_assets",
      "investment_accounts",
      "investment_transactions",
      "investment_targets",
      "investment_prices"
    ]

    const results: Record<string, boolean> = {}

    for (const t of tables) {
      const { error } = await supabaseAdmin!
        .from(t as any)
        .select("count")
        .limit(1)

      results[t] = !error
    }

    return NextResponse.json({
      success: true,
      tables: results
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

