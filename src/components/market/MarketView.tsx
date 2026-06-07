
"use client"
import Link from "next/link"
import type { MarketSummary, ProductWithAvailability, ReleaseCalendarEntry } from "@/types"
import { formatPrice, formatDate } from "@/lib/utils/format"

interface Props {
  summaries: MarketSummary[]
  trending:  Partial<ProductWithAvailability>[]
  releases:  ReleaseCalendarEntry[]
}

export function MarketView({ summaries, trending, releases }: Props) {
  const today = summaries[0]

  return (
    <div className="space-y-6">
      {/* Today's summary */}
      {today && (
        <div className="card p-6">
          <h2 className="section-title">Today&apos;s Market</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label:"Restocks",    value:today.total_restock_events, color:"var(--green)" },
              { label:"Price Drops", value:today.total_price_drops,    color:"var(--blue)"  },
              { label:"Price Rises", value:today.total_price_rises,    color:"var(--yellow)"},
            ].map(s => (
              <div key={s.label} className="card-inset p-4 text-center">
                <div className="text-3xl font-black" style={{ color:s.color }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color:"var(--muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
          {today.ai_summary && (
            <div className="rounded-xl p-4" style={{ background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.15)" }}>
              <div className="text-xs font-bold mb-1.5" style={{ color:"var(--primary)" }}>🤖 AI Daily Summary</div>
              <p className="text-sm" style={{ color:"var(--text2)" }}>{today.ai_summary}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending */}
        <section>
          <h2 className="section-title">🔥 Trending Now</h2>
          <div className="card overflow-hidden">
            {trending.slice(0,10).map((p,i) => {
              const inStock = (p.in_stock_count ?? 0) > 0
              return (
                <Link key={p.id} href={`/explore/${p.slug}`}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:opacity-80 transition-opacity ${i<9?"border-b":""}`}
                  style={{ borderColor:"var(--border)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background:"var(--surface2)", color:"var(--muted)" }}>{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color:"var(--text)" }}>{p.name}</div>
                    <div className="text-xs" style={{ color:"var(--muted)" }}>{p.set_name}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {inStock && <div className="badge badge-green text-xs py-0.5"><span className="pulse-dot w-1.5 h-1.5" />{formatPrice(p.best_price)}</div>}
                    <div className="text-xs mt-0.5" style={{ color:"var(--dim)" }}>Demand {p.demand_score}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Upcoming releases */}
        <section>
          <h2 className="section-title">📅 Upcoming Releases</h2>
          {!releases.length ? (
            <div className="card p-8 text-center text-sm" style={{ color:"var(--muted)" }}>No upcoming releases listed</div>
          ) : (
            <div className="card overflow-hidden">
              {releases.map((r,i) => {
                const date = new Date(r.release_date)
                return (
                  <div key={r.id} className={`flex items-center gap-4 px-4 py-3.5 ${i<releases.length-1?"border-b":""}`}
                    style={{ borderColor:"var(--border)" }}>
                    <div className="w-12 text-center flex-shrink-0">
                      <div className="text-xs font-semibold" style={{ color:"var(--dim)" }}>{date.toLocaleDateString("en-GB",{month:"short"})}</div>
                      <div className="text-xl font-black leading-tight" style={{ color:"var(--text)" }}>{date.getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color:"var(--text)" }}>{r.name}</div>
                      <div className="text-xs mt-0.5" style={{ color:"var(--muted)" }}>
                        {r.product_type}{r.rrp_gbp ? ` · RRP ${formatPrice(r.rrp_gbp)}` : ""}
                      </div>
                    </div>
                    <span className={`badge text-xs flex-shrink-0 ${r.is_confirmed ? "badge-green" : "badge-yellow"}`}>
                      {r.is_confirmed ? "Confirmed" : "Rumoured"}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Most restocked today */}
      {today?.most_restocked?.length > 0 && (
        <section>
          <h2 className="section-title">⚡ Most Restocked Today</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {today.most_restocked.slice(0,6).map(item => (
              <Link key={item.product_id} href={`/explore/${item.slug}`}
                className="card p-4 hover:border-brand-500/30 transition-colors">
                <div className="font-semibold text-sm truncate" style={{ color:"var(--text)" }}>{item.name}</div>
                <div className="badge badge-green text-xs mt-2">{item.restock_count}× restocked</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
