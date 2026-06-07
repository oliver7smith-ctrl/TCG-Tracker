
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { MarketView } from "@/components/market/MarketView"

export const metadata: Metadata = { title: "Market" }

export default async function MarketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [summaryRes, trendingRes, releaseRes] = await Promise.all([
    supabase.from("market_summaries").select("*").order("date", { ascending: false }).limit(7),
    supabase.from("v_products").select("id,name,slug,set_name,product_type,image_url,demand_score,in_stock_count,best_price,category_name,category_color,category_icon")
      .eq("is_active", true).order("demand_score", { ascending: false }).limit(20),
    supabase.from("release_calendar").select("*").gte("release_date", new Date().toISOString().split("T")[0])
      .order("release_date").limit(10),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 fade-in">
      <div className="mb-6">
        <h1 className="page-title">Market</h1>
        <p className="page-sub">Daily market overview and trending products</p>
      </div>
      <MarketView
        summaries={summaryRes.data ?? []}
        trending={trendingRes.data ?? []}
        releases={releaseRes.data ?? []}
      />
    </div>
  )
}
