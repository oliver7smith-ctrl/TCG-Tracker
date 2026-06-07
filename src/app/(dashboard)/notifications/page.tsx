
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { NotificationsView } from "@/components/notifications/NotificationsView"
export const metadata: Metadata = { title: "Alerts" }
export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: notifs } = await supabase
    .from("notifications")
    .select("*, product:products(name,slug,image_url), retailer:retailers(name,slug)")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100)
  // Mark all read
  supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null).then()
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 fade-in">
      <div className="mb-6">
        <h1 className="page-title">Alerts</h1>
        <p className="page-sub">Your notification history</p>
      </div>
      <NotificationsView notifications={notifs ?? []} />
    </div>
  )
}
