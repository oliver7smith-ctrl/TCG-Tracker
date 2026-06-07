
import type { StockEvent } from "@/types"
import { timeAgo, formatPrice } from "@/lib/utils/format"

const CONFIG: Record<string, { label:string; color:string; dot:string }> = {
  in_stock:   { label:"Back in stock", color:"var(--green)", dot:"#10b981" },
  sold_out:   { label:"Sold out",      color:"var(--red)",   dot:"#ef4444" },
  price_drop: { label:"Price drop",    color:"var(--blue)",  dot:"#3b82f6" },
  price_rise: { label:"Price rise",    color:"var(--yellow)",dot:"#f59e0b" },
  preorder:   { label:"Pre-order",     color:"var(--blue)",  dot:"#3b82f6" },
  backorder:  { label:"Backorder",     color:"var(--yellow)",dot:"#f59e0b" },
}

export function RecentActivity({ events }: { events: StockEvent[] }) {
  if (!events.length) {
    return (
      <section>
        <h2 className="section-title">Recent Activity</h2>
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <div className="font-semibold mb-1" style={{ color:"var(--text)" }}>No activity yet</div>
          <div className="text-sm" style={{ color:"var(--muted)" }}>Stock changes will appear here as they happen</div>
        </div>
      </section>
    )
  }
  return (
    <section>
      <h2 className="section-title">Recent Activity <span className="text-xs font-normal" style={{ color:"var(--dim)" }}>Last 24h</span></h2>
      <div className="card overflow-hidden">
        {events.slice(0,10).map((ev,i) => {
          const cfg = CONFIG[ev.event_type] ?? { label:ev.event_type, color:"var(--muted)", dot:"#64748b" }
          const prod = ev.product as { name?:string; slug?:string } | undefined
          const ret  = ev.retailer as { name?:string } | undefined
          return (
            <div key={ev.id}
              className={`flex items-start gap-3 px-4 py-3.5 hover:opacity-80 transition-opacity ${i < events.length-1 ? "border-b" : ""}`}
              style={{ borderColor:"var(--border)" }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ background:cfg.dot, boxShadow: ev.event_type==="in_stock" ? `0 0 8px ${cfg.dot}` : "none" }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color:"var(--text)" }}>{prod?.name ?? "Unknown"}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color:cfg.color }}>{cfg.label}</span>
                  {ret?.name && <span className="text-xs" style={{ color:"var(--muted)" }}>at {ret.name}</span>}
                  {ev.new_price != null && <span className="text-xs font-bold" style={{ color:"var(--text)" }}>{formatPrice(ev.new_price)}</span>}
                  {ev.previous_price != null && ev.new_price !== ev.previous_price && (
                    <span className="text-xs line-through" style={{ color:"var(--dim)" }}>{formatPrice(ev.previous_price)}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                <span className="text-xs whitespace-nowrap" style={{ color:"var(--dim)" }}>{timeAgo(ev.created_at)}</span>
                {ev.product_url && (
                  <a href={ev.fast_buy_url||ev.product_url} target="_blank" rel="noopener noreferrer"
                    className={ev.event_type==="in_stock" ? "btn-success btn-xs" : "btn-secondary btn-xs"}>
                    {ev.event_type==="in_stock" ? "Buy" : "View"}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
