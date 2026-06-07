
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "You must be logged in to redeem a code" }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 })

  const db = createServiceClient()
  const { data } = await db.rpc("redeem_invite_code", {
    p_code:    code.toUpperCase().trim(),
    p_user_id: user.id,
  })

  if (!data?.success) {
    return NextResponse.json({ error: data?.error ?? "Invalid code" }, { status: 400 })
  }
  return NextResponse.json(data)
}
