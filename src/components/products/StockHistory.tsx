
import type { StockEvent } from "@/types"
import { timeAgo, formatPrice } from "@/lib/utils/format"
const CFG: Record<string, { label:string; color:string }> = {
  in_stock:   { label:"Back in stock",  color:"var(--green)"  },
  sold_out:   { label:"Sold out",       color:"var(--red)"    },
  price_drop: { label:"Price dropped",  color:"var(--blue)"   },
  price_rise: { label:"Price rose",     color:"var(--yellow)" },
  preorder:   { label:"Pre-order",      color:"var(--blue)"   },
}
export function StockHistory({ events }: { events: StockEvent[] }) {
  return (
    <section>
      <h2 className="section-title">Stock History</h2>
      <div className="card overflow-hidden">
        {events.slice(0,15).map((ev,i) => {
          const cfg = CFG[ev.event_type] ?? { label:ev.event_type, color:"var(--muted)" }
          const ret = ev.retailer as { name?:string } | undefined
          return (
            <div key={ev.id} className={`flex items-start gap-3 px-4 py-3 ${i<events.length-1?"border-b":""}`} style={{ borderColor:"var(--border)" }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background:cfg.color }} />
              <div className="flex-1 text-sm">
                <span className="font-semibold" style={{ color:cfg.color }}>{cfg.label}</span>
                {ret?.name && <span style={{ color:"var(--muted)" }}> at {ret.name}</span>}
                {ev.new_price!=null && <span style={{ color:"var(--text)" }}> · {formatPrice(ev.new_price)}</span>}
                {ev.previous_price!=null && ev.new_price!==ev.previous_price && (
                  <span className="line-through ml-2 text-xs" style={{ color:"var(--dim)" }}>{formatPrice(ev.previous_price)}</span>
                )}
              </div>
              <span className="text-xs flex-shrink-0" style={{ color:"var(--dim)" }}>{timeAgo(ev.created_at)}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
