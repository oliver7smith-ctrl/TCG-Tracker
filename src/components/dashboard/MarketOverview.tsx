
import type { MarketSummary } from "@/types"
import Link from "next/link"
interface Props { summary: MarketSummary }
export function MarketOverview({ summary }: Props) {
  const hasData = summary.total_restock_events > 0 || summary.most_restocked.length > 0
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title mb-0">Market Today</h2>
        <Link href="/market" className="text-xs font-semibold" style={{ color:"var(--primary)" }}>Full market →</Link>
      </div>
      <div className="card p-5">
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label:"Restocks",    value:summary.total_restock_events, color:"var(--green)" },
            { label:"Price Drops", value:summary.total_price_drops,    color:"var(--blue)"  },
            { label:"Price Rises", value:summary.total_price_rises,    color:"var(--yellow)"},
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black" style={{ color:s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color:"var(--muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {summary.most_restocked.length > 0 && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color:"var(--dim)" }}>Most Restocked Today</div>
            <div className="space-y-2">
              {summary.most_restocked.slice(0,5).map(item => (
                <div key={item.product_id} className="flex items-center justify-between">
                  <Link href={`/explore/${item.slug}`} className="text-sm font-medium hover:underline truncate" style={{ color:"var(--text)" }}>{item.name}</Link>
                  <span className="badge badge-green text-xs ml-2 flex-shrink-0">{item.restock_count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {!hasData && (
          <div className="text-center py-4 text-sm" style={{ color:"var(--muted)" }}>
            Market data updates daily at 6am UTC
          </div>
        )}
      </div>
    </section>
  )
}
