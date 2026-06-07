
import { createServiceClient } from "@/lib/supabase/service"

export async function computeDemandScores(): Promise<void> {
  const db = createServiceClient()
  await db.rpc("compute_demand_scores").maybeSingle()
}

export async function computeMarketSummary(): Promise<void> {
  const db   = createServiceClient()
  const date = new Date().toISOString().split("T")[0]
  await db.rpc("compute_market_summary", { p_date: date }).maybeSingle()
}

export async function updatePortfolioValues(): Promise<void> {
  const db = createServiceClient()
  const { data: items } = await db
    .from("collection")
    .select("id, product_id, quantity_owned")
    .is("current_value_each", null)

  if (!items?.length) return

  for (const item of items) {
    const { data: rp } = await db
      .from("retailer_products")
      .select("current_price")
      .eq("product_id", item.product_id)
      .not("current_price", "is", null)
      .order("current_price", { ascending: true })
      .limit(1)
      .single()

    if (rp?.current_price) {
      await db.from("collection").update({
        current_value_each:  rp.current_price,
        current_value_total: rp.current_price * item.quantity_owned,
        last_valued_at:      new Date().toISOString(),
      }).eq("id", item.id)
    }
  }
}

export function calculatePortfolioSummary(rows: Array<{
  purchase_price_total?: number | null
  current_value_total?: number | null
  category_name?: string
  category_color?: string
}>) {
  const totalCost  = rows.reduce((s, r) => s + (r.purchase_price_total  ?? 0), 0)
  const totalValue = rows.reduce((s, r) => s + (r.current_value_total   ?? 0), 0)
  const pnl  = totalValue - totalCost
  const roi  = totalCost > 0 ? Math.round((pnl / totalCost) * 10000) / 100 : 0

  const catMap = new Map<string, { value: number; cost: number; color: string }>()
  for (const r of rows) {
    const cat = r.category_name ?? "Other"
    const ex  = catMap.get(cat) ?? { value: 0, cost: 0, color: r.category_color ?? "#6B7280" }
    catMap.set(cat, {
      value: ex.value + (r.current_value_total  ?? 0),
      cost:  ex.cost  + (r.purchase_price_total  ?? 0),
      color: ex.color,
    })
  }

  return {
    totalItems:        rows.length,
    totalCostBasis:    Math.round(totalCost  * 100) / 100,
    totalCurrentValue: Math.round(totalValue * 100) / 100,
    unrealisedPnl:     Math.round(pnl * 100) / 100,
    roiPct:            roi,
    categoryBreakdown: Array.from(catMap.entries()).map(([category, d]) => ({
      category,
      value: Math.round(d.value * 100) / 100,
      cost:  Math.round(d.cost  * 100) / 100,
      pnl:   Math.round((d.value - d.cost) * 100) / 100,
      color: d.color,
    })).sort((a, b) => b.value - a.value),
    topGainers: [],
    topLosers:  [],
  }
}
