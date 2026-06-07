
// Stock check cron — runs all tiers in one call for Vercel Free
// Vercel Free: 1 cron job max, minimum every hour
// For more frequent checks, use the admin manual trigger or an external cron service

import { NextRequest, NextResponse } from "next/server"
import { runBatch } from "@/lib/stock/checker"
import { dispatchForEvent } from "@/lib/notifications/dispatch"
import { createServiceClient } from "@/lib/supabase/service"

export const maxDuration = 60

function isAuthorised(req: NextRequest): boolean {
  return (
    req.headers.get("x-vercel-cron") === "1" ||
    req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`
  )
}

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const tier = (req.nextUrl.searchParams.get("tier") ?? "all") as "high" | "medium" | "low" | "all"
  const results: Record<string, unknown> = {}

  try {
    if (tier === "all") {
      // Run all tiers in sequence — for free tier single cron
      results.high   = await runBatch("high")
      results.medium = await runBatch("medium")
      results.low    = await runBatch("low")
    } else {
      results[tier] = await runBatch(tier)
    }

    // Dispatch notifications for recent events
    const totalEvents = Object.values(results).reduce(
      (sum: number, r: unknown) => sum + ((r as { events?: number })?.events ?? 0), 0
    )

    if (totalEvents > 0) {
      const db    = createServiceClient()
      const since = new Date(Date.now() - 6 * 60000).toISOString()
      const { data: evts } = await db.from("stock_events")
        .select("id")
        .in("event_type", ["in_stock", "price_drop", "preorder"])
        .gte("created_at", since)
        .limit(30)
      await Promise.allSettled(
        (evts ?? []).map(e => dispatchForEvent(e.id).catch(console.error))
      )
    }

    return NextResponse.json({ ok: true, tier, results, totalEvents })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    console.error("[cron/check-stock]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
