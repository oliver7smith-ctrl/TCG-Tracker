
// Manual stock check endpoint — for testing without cron jobs
// Only accessible to admin and founder accounts

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin, getProfile } from "@/lib/auth/permissions"
import { runBatch } from "@/lib/stock/checker"
import { dispatchForEvent } from "@/lib/notifications/dispatch"
import { createServiceClient } from "@/lib/supabase/service"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const profile = await getProfile()
  if (!isAdmin(profile)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const { tier = "high" } = await req.json().catch(() => ({}))

  try {
    const result = await runBatch(tier)

    // Dispatch notifications for any new events
    if (result.events > 0) {
      const db    = createServiceClient()
      const since = new Date(Date.now() - 5 * 60000).toISOString()
      const { data: evts } = await db.from("stock_events")
        .select("id")
        .in("event_type", ["in_stock", "price_drop", "preorder"])
        .gte("created_at", since)
        .limit(20)
      await Promise.allSettled(
        (evts ?? []).map(e => dispatchForEvent(e.id).catch(console.error))
      )
    }

    return NextResponse.json({ ok: true, tier, ...result })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
