
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit")||"50"), 100)
  const { data, error } = await supabase.from("notifications")
    .select("*, product:products(name,slug,image_url), retailer:retailers(name,slug)")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
export async function PATCH(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
