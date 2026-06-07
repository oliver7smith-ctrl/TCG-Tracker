
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculatePortfolioSummary } from "@/lib/analytics/demand"
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("subscription_tier").eq("id", user.id).single()
  if (profile?.subscription_tier === "free") return NextResponse.json({ error: "Premium required" }, { status: 403 })
  const { data, error } = await supabase.from("v_portfolio").select("*").eq("user_id", user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const summary = calculatePortfolioSummary(data ?? [])
  return NextResponse.json({ portfolio: data ?? [], summary })
}
