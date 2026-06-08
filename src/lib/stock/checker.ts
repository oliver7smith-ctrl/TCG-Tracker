
import { createServiceClient } from "@/lib/supabase/service"
import { checkShopify } from "./adapters/shopify"
import { checkHtml }    from "./adapters/html"
import type { RetailerProduct, StockCheckResult, CheckTier } from "@/types"

// Per-domain rate limiting
const domainCalls = new Map<string, number>()
async function rateLimit(domain: string, minGapMs: number) {
  const last = domainCalls.get(domain) ?? 0
  const wait = minGapMs - (Date.now() - last)
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  domainCalls.set(domain, Date.now())
}

async function runCheck(rp: RetailerProduct): Promise<StockCheckResult> {
  const r = rp.retailer!
  await rateLimit(r.domain, Math.ceil(60000 / (r.rate_limit_per_min || 10)))
  return r.is_shopify ? checkShopify(rp.id, rp.product_url) : checkHtml(rp.id, rp.product_url)
}

export async function processResult(rp: RetailerProduct, result: StockCheckResult): Promise<string[]> {
  const db          = createServiceClient()
  const prevStatus  = rp.current_stock_status
  const prevPrice   = rp.current_price
  const newStatus   = result.stockStatus
  const newPrice    = result.price
  const isError     = !!result.error
  const eventIds: string[] = []

  // 1. Log raw check
  await db.from("stock_checks").insert({
    retailer_product_id: rp.id,
    price: newPrice, stock_status: newStatus,
    http_status: result.httpStatus, response_ms: result.responseMs,
    error_message: result.error, checked_at: result.checkedAt,
  })

  // 2. Update retailer_product
  await db.from("retailer_products").update({
    current_price:        newPrice,
    previous_price:       prevPrice,
    current_stock_status: newStatus,
    previous_stock_status:prevStatus,
    fast_buy_url:         result.fastBuyUrl,
    last_checked_at:      result.checkedAt,
    error_count:          isError ? (rp.error_count||0)+1 : 0,
    consecutive_errors:   isError ? (rp.consecutive_errors||0)+1 : 0,
    last_error:           result.error ?? null,
    last_error_at:        isError ? result.checkedAt : rp.last_error_at,
    ...(newStatus === "in_stock" && prevStatus !== "in_stock" ? { last_in_stock_at: result.checkedAt } : {}),
    ...(newPrice !== prevPrice && newPrice !== null          ? { last_price_change_at: result.checkedAt } : {}),
  }).eq("id", rp.id)

  // 3. Price history
  if (newPrice !== null && newPrice !== prevPrice) {
    await db.from("price_history").insert({
      retailer_product_id: rp.id,
      product_id: rp.product_id, retailer_id: rp.retailer_id,
      price: newPrice, stock_status: newStatus,
      source: "check", recorded_at: result.checkedAt,
    })
  }

  // 4. Stock events
  const events: object[] = []
  const statusChanged = prevStatus !== newStatus

  if (statusChanged && !isError) {
    const valid = ["in_stock","sold_out","preorder","backorder","unavailable"]
    if (valid.includes(newStatus)) {
      events.push({
        retailer_product_id: rp.id, product_id: rp.product_id, retailer_id: rp.retailer_id,
        event_type: newStatus, previous_status: prevStatus, new_status: newStatus,
        previous_price: prevPrice, new_price: newPrice,
        price_change_gbp: null, price_change_pct: null,
        fast_buy_url: result.fastBuyUrl, product_url: rp.product_url,
      })
    }
  }

  const priceDrop = !statusChanged && newPrice !== null && prevPrice !== null && newPrice < prevPrice
  const priceRise = !statusChanged && newPrice !== null && prevPrice !== null && newPrice > prevPrice

  if ((priceDrop || priceRise) && newPrice && prevPrice) {
    const chgGbp = Math.round((newPrice - prevPrice) * 100) / 100
    const chgPct = Math.round(((newPrice - prevPrice) / prevPrice) * 10000) / 100
    events.push({
      retailer_product_id: rp.id, product_id: rp.product_id, retailer_id: rp.retailer_id,
      event_type: priceDrop ? "price_drop" : "price_rise",
      previous_status: prevStatus, new_status: newStatus,
      previous_price: prevPrice, new_price: newPrice,
      price_change_gbp: chgGbp, price_change_pct: chgPct,
      fast_buy_url: result.fastBuyUrl, product_url: rp.product_url,
    })
  }

  if (events.length > 0) {
    const { data: ins } = await db.from("stock_events").insert(events).select("id")
    if (ins) eventIds.push(...ins.map((e: {id:string}) => e.id))
  }

  // 5. Retailer reliability
  if (result.responseMs > 0) {
    await db.rpc("update_retailer_reliability", {
      p_retailer_id: rp.retailer_id, p_response_ms: result.responseMs, p_success: !isError,
    }).maybeSingle()
  }

  return eventIds
}

export async function runBatch(tier: CheckTier): Promise<{checked:number;events:number;errors:number}> {
  const db  = createServiceClient()
  const ageMap: Record<string, number> = { high: 120, medium: 300, low: 900, paused: 999999 }
  const cutoff = new Date(Date.now() - ageMap[tier] * 1000).toISOString()

  const { data: items } = await db
    .from("retailer_products")
    .select("*, retailer:retailers(*)")
    .eq("is_active", true)
    .eq("check_tier", tier)
    .or(`last_checked_at.is.null,last_checked_at.lt.${cutoff}`)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(tier === "high" ? 40 : tier === "medium" ? 25 : 15)

  if (!items?.length) return { checked: 0, events: 0, errors: 0 }

  let checked = 0, errors = 0, totalEvents = 0

  for (const item of items as RetailerProduct[]) {
    try {
      if (checked > 0) await new Promise(r => setTimeout(r, 500))
      const result = await runCheck(item)
      const evts   = await processResult(item, result)
      totalEvents += evts.length
      if (result.error) errors++
      checked++
    } catch (e) { console.error("[Checker]", item.id, e); errors++ }
  }

  return { checked, events: totalEvents, errors }
}
