
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
export const metadata: Metadata = { title: "Release Calendar" }
function dayNum(d: string) { return new Date(d).getDate() }
function monthShort(d: string) { return new Date(d).toLocaleDateString("en-GB",{month:"short"}) }
function isFuture(d: string) { return new Date(d) >= new Date(new Date().toDateString()) }
export default async function ReleasesPage() {
  const supabase = await createClient()
  const { data: entries } = await supabase
    .from("release_calendar")
    .select("*, category:categories(name,color,icon_emoji,slug)")
    .order("release_date")
  const upcoming = (entries ?? []).filter(e => isFuture(e.release_date))
  const past     = (entries ?? []).filter(e => !isFuture(e.release_date)).reverse()
  const RenderList = ({ items }: { items: typeof entries }) => (
    <div className="space-y-3">
      {(items ?? []).map(e => {
        const cat = e.category as { name?:string; color?:string; icon_emoji?:string } | undefined
        return (
          <div key={e.id} className="card p-4 flex items-center gap-4">
            <div className="w-14 text-center flex-shrink-0">
              <div className="text-xs font-semibold" style={{ color:"var(--dim)" }}>{monthShort(e.release_date)}</div>
              <div className="text-2xl font-black" style={{ color:"var(--text)" }}>{dayNum(e.release_date)}</div>
            </div>
            <div className="w-px h-10 rounded-full flex-shrink-0" style={{ background: cat?.color ?? "var(--border)" }} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate" style={{ color:"var(--text)" }}>{e.name}</div>
              <div className="text-xs mt-0.5" style={{ color:"var(--muted)" }}>
                {cat?.icon_emoji} {e.set_name && `${e.set_name} · `}{e.product_type}
                {e.rrp_gbp && ` · RRP £${e.rrp_gbp.toFixed(2)}`}
              </div>
            </div>
            <span className={`badge text-xs flex-shrink-0 ${e.is_confirmed ? "badge-green" : "badge-yellow"}`}>
              {e.is_confirmed ? "Confirmed" : "Rumoured"}
            </span>
          </div>
        )
      })}
    </div>
  )
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 fade-in">
      <div className="mb-6">
        <h1 className="page-title">Release Calendar</h1>
        <p className="page-sub">Upcoming and recent TCG releases</p>
      </div>
      {upcoming.length > 0 ? (
        <section className="mb-10">
          <h2 className="section-title">Upcoming</h2>
          <RenderList items={upcoming} />
        </section>
      ) : (
        <div className="card p-8 text-center mb-8">
          <div className="text-4xl mb-3">📅</div>
          <div className="font-bold" style={{ color:"var(--text)" }}>No upcoming releases listed yet</div>
        </div>
      )}
      {past.length > 0 && (
        <section>
          <h2 className="section-title">Recent</h2>
          <RenderList items={past.slice(0,10)} />
        </section>
      )}
    </div>
  )
}
