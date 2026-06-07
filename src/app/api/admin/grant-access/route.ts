
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getProfile, isAdmin } from "@/lib/auth/permissions"

export async function POST(req: NextRequest) {
  const profile = await getProfile()
  if (!isAdmin(profile)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const { email, tier, days } = await req.json()
  if (!email || !tier) {
    return NextResponse.json({ error: "email and tier are required" }, { status: 400 })
  }

  const db = createServiceClient()
  const { data } = await db.rpc("admin_grant_access", {
    p_target_email: email,
    p_tier:         tier,
    p_days:         days ?? null,
  })

  if (!data?.success) {
    return NextResponse.json({ error: data?.error ?? "Failed" }, { status: 400 })
  }
  return NextResponse.json(data)
}
