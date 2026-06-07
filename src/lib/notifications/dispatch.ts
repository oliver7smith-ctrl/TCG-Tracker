
import { createServiceClient } from "@/lib/supabase/service"
import { sendPush }  from "./push"
import { sendEmail } from "./email"
import { sendSms }   from "./sms"
import type { StockEvent, Profile, Product, Retailer, AlertChannel } from "@/types"

const db = () => createServiceClient()

function isQuietHour(p: Profile): boolean {
  if (!p.quiet_hours_enabled) return false
  const h = new Date().getUTCHours()
  const { quiet_start_hour: s, quiet_end_hour: e } = p
  return s > e ? h >= s || h < e : h >= s && h < e
}

export async function dispatchForEvent(eventId: string): Promise<void> {
  const supabase = db()

  const { data: ev } = await supabase
    .from("stock_events")
    .select("*, product:products(*), retailer:retailers(*)")
    .eq("id", eventId)
    .single()
  if (!ev) return

  const event   = ev as StockEvent & { product: Product; retailer: Retailer }
  const product = event.product
  const retailer = event.retailer

  const { data: watchers } = await supabase
    .from("watchlist")
    .select("*, profile:profiles(*)")
    .eq("product_id", event.product_id)
    .eq("alerts_enabled", true)
  if (!watchers?.length) return

  for (const watcher of watchers) {
    const profile = watcher.profile as Profile
    if (!profile) continue

    // Alert type gates
    if (event.event_type === "in_stock"   && !watcher.alert_on_in_stock)   continue
    if (event.event_type === "preorder"   && !watcher.alert_on_preorder)   continue
    if (event.event_type === "price_drop" && !watcher.alert_on_price_drop) continue
    if (!["in_stock","preorder","backorder","price_drop"].includes(event.event_type)) continue

    // Price gate
    const maxP = watcher.max_price ?? profile.global_max_price
    if (maxP !== null && event.new_price !== null && event.new_price > maxP) continue

    // Retailer filter
    if (!watcher.watch_all_retailers && watcher.specific_retailer_ids?.length) {
      if (!watcher.specific_retailer_ids.includes(event.retailer_id)) continue
    }

    // SMS tier check
    if (!profile.sms_alerts || profile.subscription_tier === "free") {
      // skip SMS for free users — already enforced in tiers, but double-check
    }

    // Quiet hours (allow in_stock through regardless)
    if (isQuietHour(profile) && event.event_type !== "in_stock") continue

    // Cooldown
    const cooldown = (profile.min_alert_interval_mins ?? 30) * 60000
    const since    = new Date(Date.now() - cooldown).toISOString()
    const { count } = await supabase.from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id).eq("product_id", event.product_id)
      .eq("status", "sent").gte("sent_at", since)
    if ((count ?? 0) > 0) continue

    // Build message
    const priceStr = event.new_price ? `£${event.new_price.toFixed(2)}` : "Price TBC"
    const labels: Record<string, string> = {
      in_stock:"In Stock", preorder:"Pre-order Available",
      backorder:"Back in Stock", price_drop:"Price Drop",
    }
    const label  = labels[event.event_type] ?? event.event_type
    const title  = `${label}: ${product.name}`
    const body   = `${retailer.name} · ${priceStr}${event.event_type==="price_drop"&&event.previous_price?` (was £${event.previous_price.toFixed(2)})`:"" }`
    const buyUrl = event.fast_buy_url || event.product_url

    // Determine channels based on profile + tier
    const channels: AlertChannel[] = []
    if (profile.push_alerts && profile.push_subscription)                              channels.push("push")
    if (profile.email_alerts && profile.email)                                          channels.push("email")
    if (profile.sms_alerts && profile.phone && profile.subscription_tier !== "free")   channels.push("sms")

    for (const channel of channels) {
      const { data: notif } = await supabase.from("notifications").insert({
        user_id: profile.id, stock_event_id: eventId,
        product_id: event.product_id, retailer_id: event.retailer_id,
        channel, status: "pending", title, body,
        product_url: event.product_url, fast_buy_url: event.fast_buy_url,
        price: event.new_price,
      }).select().single()
      if (!notif) continue

      try {
        if (channel === "push")  await sendPush(profile, title, body, buyUrl)
        if (channel === "email") await sendEmail(profile.email, title, body, event as StockEvent & {product:Product;retailer:Retailer}, buyUrl)
        if (channel === "sms")   await sendSms(profile.phone!, `${title} - ${retailer.name} ${priceStr}. Buy: ${buyUrl}`)
        await supabase.from("notifications").update({ status:"sent", sent_at:new Date().toISOString() }).eq("id", notif.id)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Send failed"
        await supabase.from("notifications").update({ status:"failed", error_message:msg, retry_count:(notif.retry_count||0)+1 }).eq("id", notif.id)
      }
    }
  }
}
