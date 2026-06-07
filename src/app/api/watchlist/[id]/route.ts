
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
export async function PATCH(req: NextRequest, { params }: { params: Promise<{id:string}> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const { id }   = await params
  const body     = await req.json()
  const allowed  = ["max_price","desired_quantity","priority","alerts_enabled","alert_on_in_stock","alert_on_preorder","alert_on_price_drop","watch_all_retailers","specific_retailer_ids","notes"]
  const update: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) update[k] = body[k]
  const { data, error } = await supabase.from("watchlist").update(update).eq("id", id).eq("user_id", user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{id:string}> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const { id } = await params
  const { error } = await supabase.from("watchlist").delete().eq("id", id).eq("user_id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
