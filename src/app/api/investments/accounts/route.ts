"use server"

import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient, createServiceClient } from "@/utils/supabase/server"
import { z } from "zod"

const PostSchema = z.object({
  name: z.string().min(1).max(120),
  broker: z.string().min(1).max(60).optional()
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get("user_id") || undefined
    const { data: { user } } = await supabase.auth.getUser()
    const effectiveUserId = user?.id || userIdParam

    if (!effectiveUserId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    let client = supabase
    // Se não houver sessão (user), usa service role apenas para leitura filtrada por user_id
    if (!user) {
      client = createServiceClient()
    }

    const { data, error } = await client
      .from("investment_accounts")
      .select("id,broker,account_code")
      .eq("user_id", effectiveUserId)
      .order("account_code", { ascending: true })
      .limit(1000)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const accounts = (data || []).map((row: any) => ({
      id: row.id,
      name: row.account_code || row.broker || "Conta",
      broker: row.broker || null
    }))
    return NextResponse.json({ accounts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
    }
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    const { name, broker } = parsed.data
    const { data, error } = await supabase
      .from("investment_accounts")
      .insert({ user_id: user.id, account_code: name, broker: broker || null })
      .select("id,account_code,broker")
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const account = {
      id: data.id,
      name: data.account_code || data.broker || "Conta",
      broker: data.broker || null
    }
    return NextResponse.json({ success: true, account })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
