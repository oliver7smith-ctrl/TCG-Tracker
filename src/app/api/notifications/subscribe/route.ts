
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const sub = await req.json()
  if (!sub?.endpoint) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  const { error } = await supabase.from("profiles").update({ push_subscription: sub, push_alerts: true }).eq("id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
