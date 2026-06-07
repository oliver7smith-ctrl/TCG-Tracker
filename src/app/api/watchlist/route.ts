
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkWatchlistLimit } from "@/lib/auth/permissions"
import { WatchlistSchema } from "@/lib/utils/validation"

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const { data, error } = await supabase
    .from("v_watchlist").select("*").eq("user_id", user.id)
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  // Server-side tier check — cannot be bypassed from browser
  const { allowed, current, limit } = await checkWatchlistLimit(user.id)
  if (!allowed) {
    return NextResponse.json({
      error: `Watchlist limit reached (${current}/${limit}). Upgrade to Premium for more.`,
      code: "LIMIT_REACHED",
      limit,
    }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = WatchlistSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const { data, error } = await supabase.from("watchlist")
    .upsert({ ...parsed.data, user_id: user.id }, { onConflict: "user_id,product_id" })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const { product_id } = await req.json()
  if (!product_id) return NextResponse.json({ error: "product_id required" }, { status: 400 })
  const { error } = await supabase.from("watchlist")
    .delete().eq("user_id", user.id).eq("product_id", product_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
