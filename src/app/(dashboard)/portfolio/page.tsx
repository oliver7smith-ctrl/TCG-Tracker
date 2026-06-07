
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PortfolioDashboard } from "@/components/portfolio/PortfolioDashboard"
import { calculatePortfolioSummary } from "@/lib/analytics/demand"
import Link from "next/link"

export const metadata: Metadata = { title: "Portfolio" }

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("subscription_tier").eq("id", user.id).single()

  if (profile?.subscription_tier === "free") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-5">💹</div>
        <h1 className="text-2xl font-black mb-3" style={{ color:"var(--text)" }}>Portfolio Tracking</h1>
        <p className="text-base mb-8" style={{ color:"var(--muted)" }}>
          Track your collection value, P&amp;L, ROI and investment performance. Available on Premium.
        </p>
        <Link href="/settings?tab=billing" className="btn-primary btn-lg">Upgrade to Premium →</Link>
      </div>
    )
  }

  const { data: portfolio } = await supabase
    .from("v_portfolio").select("*").eq("user_id", user.id)

  const summary = calculatePortfolioSummary(portfolio ?? [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 fade-in">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Portfolio</h1>
          <p className="page-sub">Investment performance and collection value</p>
        </div>
      </div>
      <PortfolioDashboard portfolio={portfolio ?? []} summary={summary} />
    </div>
  )
}
