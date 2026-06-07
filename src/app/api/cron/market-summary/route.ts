
import { NextRequest, NextResponse } from "next/server"
import { computeMarketSummary } from "@/lib/analytics/demand"
export const maxDuration = 60
function auth(req: NextRequest) {
  return req.headers.get("x-vercel-cron") === "1" || req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`
}
export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  await computeMarketSummary()
  return NextResponse.json({ ok: true })
}
