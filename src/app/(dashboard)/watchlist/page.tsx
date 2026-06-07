
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { WatchlistView } from "@/components/watchlist/WatchlistView"
export const metadata: Metadata = { title: "Watchlist" }
export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const [wlRes, retRes] = await Promise.all([
    supabase.from("v_watchlist").select("*").eq("user_id", user.id).order("priority").order("created_at", { ascending: false }),
    supabase.from("retailers").select("id,name,slug").eq("is_active", true).order("sort_order"),
  ])
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 fade-in">
      <div className="mb-6">
        <h1 className="page-title">Watchlist</h1>
        <p className="page-sub">{wlRes.data?.length ?? 0} products tracked</p>
      </div>
      <WatchlistView watchlist={wlRes.data ?? []} userId={user.id} retailers={retRes.data ?? []} />
    </div>
  )
}
