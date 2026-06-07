
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { DashboardStats }   from "@/components/dashboard/DashboardStats"
import { InStockAlert }     from "@/components/dashboard/InStockAlert"
import { MarketOverview }   from "@/components/dashboard/MarketOverview"
import { WatchlistPreview } from "@/components/dashboard/WatchlistPreview"
import { RecentActivity }   from "@/components/dashboard/RecentActivity"
import { ProductSearch }    from "@/components/products/ProductSearch"
import { PushPrompt }       from "@/components/notifications/PushPrompt"
import { UpgradeBanner }    from "@/components/settings/UpgradeBanner"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const since24h = new Date(Date.now() - 86400000).toISOString()

  const [watchlistRes, eventsRes, marketRes, profileRes, portfolioRes] = await Promise.all([
    supabase.from("v_watchlist").select("*").eq("user_id", user.id).order("priority").order("created_at", { ascending: false }),
    supabase.from("stock_events").select("*, product:products(name,image_url,slug,set_name,product_type), retailer:retailers(name,slug)")
      .in("event_type", ["in_stock","price_drop","preorder"]).gte("created_at", since24h)
      .order("created_at", { ascending: false }).limit(25),
    supabase.from("market_summaries").select("*").order("date", { ascending: false }).limit(1).single(),
    supabase.from("profiles").select("subscription_tier,push_subscription,onboarding_completed").eq("id", user.id).single(),
    supabase.from("v_portfolio").select("unrealised_pnl,roi_pct,current_value_total")
      .eq("user_id", user.id).limit(1),
  ])

  const watchlist    = watchlistRes.data  ?? []
  const events       = eventsRes.data     ?? []
  const market       = marketRes.data
  const profile      = profileRes.data
  const inStockItems = watchlist.filter(w => w.in_stock_count > 0)

  // Portfolio totals
  const portfolioValue = (portfolioRes.data ?? []).reduce((s: number, r: { current_value_total?: number | null }) => s + (r.current_value_total ?? 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 fade-in">
      {!profile?.push_subscription && <PushPrompt />}
      {profile?.subscription_tier === "free" && events.filter(e => e.event_type === "in_stock").length > 2 && <UpgradeBanner />}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Your collector&apos;s operating system</p>
        </div>
      </div>

      <ProductSearch userId={user.id} watchlistProductIds={watchlist.map(w => w.product_id)} />

      <DashboardStats watchlist={watchlist} events={events} portfolioValue={portfolioValue} />

      {inStockItems.length > 0 && <InStockAlert items={inStockItems} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {market && <MarketOverview summary={market} />}
          <RecentActivity events={events} />
        </div>
        <div>
          <WatchlistPreview watchlist={watchlist.slice(0, 6)} userId={user.id} />
        </div>
      </div>
    </div>
  )
}
