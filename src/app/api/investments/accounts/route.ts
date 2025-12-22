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
    if (!userId) {
      return NextResponse.json({ error: "user_id é obrigatório" }, { status: 400 })
    }
    const { data, error } = await supabase
      .from("investment_accounts")
      .select("id,name,broker")
      .eq("user_id", userId)
      .order("name", { ascending: true })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ accounts: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, name, broker } = body || {}
    if (!user_id || !name) {
      return NextResponse.json({ error: "user_id e name são obrigatórios" }, { status: 400 })
    }
    const { data, error } = await supabase
      .from("investment_accounts")
      .insert({ user_id, name, broker: broker || null })
      .select("id,name,broker")
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, account: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
