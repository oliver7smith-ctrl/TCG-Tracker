
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
function auth(req: NextRequest) {
  return req.headers.get("x-vercel-cron") === "1" || req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`
}
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const db = createServiceClient()
  const cut30 = new Date(Date.now() - 30*86400000).toISOString()
  const cut90 = new Date(Date.now() - 90*86400000).toISOString()
  await Promise.all([
    db.from("stock_checks").delete().lt("checked_at", cut30),
    db.from("notifications").delete().lt("created_at", cut90).eq("status", "sent"),
  ])
  return NextResponse.json({ ok: true })
}
