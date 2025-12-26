"use server"

import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/utils/supabase/server"
import { z } from "zod"

const PostSchema = z.object({
  name: z.string().min(1).max(120),
  broker: z.string().min(1).max(60).optional()
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    const { data, error } = await supabase
      .from("investment_accounts")
      .select("id,name,broker")
      .eq("user_id", user.id)
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
      .insert({ user_id: user.id, name, broker: broker || null })
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
