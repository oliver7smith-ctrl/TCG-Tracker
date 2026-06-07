
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin, getProfile } from "@/lib/auth/permissions"
import { AdminUsersView } from "@/components/admin/AdminUsersView"

export const metadata: Metadata = { title: "Admin — Users" }

export default async function AdminUsersPage() {
  const profile = await getProfile()
  if (!isAdmin(profile)) redirect("/dashboard")

  const supabase = await createClient()
  const { data: users } = await supabase
    .from("profiles")
    .select("id,email,display_name,role,subscription_tier,subscription_status,subscription_ends_at,created_at,watchlist_count,collection_count,last_active_at")
    .order("created_at", { ascending: false })
    .limit(200)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 fade-in">
      <div className="mb-6">
        <h1 className="page-title">Users</h1>
        <p className="page-sub">{users?.length ?? 0} accounts</p>
      </div>
      <AdminUsersView users={users ?? []} />
    </div>
  )
}
