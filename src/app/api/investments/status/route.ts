"use server"

import { NextResponse } from "next/server"
import { createClient as createSupabaseClient, createServiceClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 })
    }

    const tables = [
      "investment_assets",
      "investment_accounts",
      "investment_transactions",
      "investment_targets",
      "investment_prices"
    ]

    const results: Record<string, boolean> = {}
    const serviceSupabase = createServiceClient()

    for (const t of tables) {
      const { error } = await serviceSupabase
        .from(t as any)
        .select("id")
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
