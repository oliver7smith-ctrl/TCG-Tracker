
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getProfile, isAdmin } from "@/lib/auth/permissions"
import { createClient } from "@/lib/supabase/server"
import { AdminOverview } from "@/components/admin/AdminOverview"

export const metadata: Metadata = { title: "Admin" }

export default async function AdminPage() {
  const profile = await getProfile()
  if (!isAdmin(profile)) redirect("/dashboard")

  const supabase = await createClient()
  const [usersR, productsR, retailersR, eventsR, rpR] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("retailers").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("stock_events").select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
    supabase.from("retailer_products").select("id", { count: "exact", head: true }),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 fade-in">
      <div className="mb-6">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-sub">Platform management</p>
      </div>
      <AdminOverview
        userCount={usersR.count ?? 0}
        productCount={productsR.count ?? 0}
        retailerProductCount={rpR.count ?? 0}
        events24h={eventsR.count ?? 0}
        retailers={retailersR.data ?? []}
      />
    </div>
  )
}
