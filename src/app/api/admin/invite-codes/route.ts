
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getProfile, isAdmin } from "@/lib/auth/permissions"

function generateCode(): string {
  // Format: XXXX-XXXX-XXXX using crypto-safe random
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no confusable chars
  let code = ""
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) code += "-"
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function GET(_req: NextRequest) {
  const profile = await getProfile()
  if (!isAdmin(profile)) return NextResponse.json({ error: "Admin required" }, { status: 403 })
  const db = createServiceClient()
  const { data, error } = await db.from("invite_codes")
    .select("*, redemptions:invite_redemptions(count)")
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const profile = await getProfile()
  if (!isAdmin(profile)) return NextResponse.json({ error: "Admin required" }, { status: 403 })

  const body = await req.json()
  const db   = createServiceClient()
  const code = body.code?.toUpperCase().trim() || generateCode()

  const { data, error } = await db.from("invite_codes").insert({
    code,
    label:                body.label,
    grants_tier:          body.grants_tier   ?? "premium",
    grants_duration_days: body.duration_days ?? null,
    max_uses:             body.max_uses       ?? 1,
    expires_at:           body.expires_at     ?? null,
    created_by:           profile!.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const profile = await getProfile()
  if (!isAdmin(profile)) return NextResponse.json({ error: "Admin required" }, { status: 403 })
  const { id } = await req.json()
  const db = createServiceClient()
  await db.from("invite_codes").update({ is_active: false }).eq("id", id)
  return NextResponse.json({ success: true })
}
