
import Link from "next/link"
import type { WatchlistWithStatus } from "@/types"
export function InStockAlert({ items }: { items: WatchlistWithStatus[] }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="pulse-dot" />
        <h2 className="section-title mb-0" style={{ color:"var(--green)" }}>In Stock Now · {items.length} item{items.length!==1?"s":""}</h2>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <Link key={item.id} href={`/explore/${item.product_id}`}
            className="card p-4 flex items-center gap-4 hover:border-emerald-500/30 transition-all block"
            style={{ borderColor:"rgba(16,185,129,0.2)", background:"rgba(16,185,129,0.02)" }}>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate" style={{ color:"var(--text)" }}>{item.product_name}</div>
              <div className="text-xs mt-0.5" style={{ color:"var(--muted)" }}>{item.set_name} · {item.product_type}</div>
            </div>
            <div className="text-right flex-shrink-0">
              {item.best_price != null && <div className="text-lg font-black" style={{ color:"var(--green)" }}>£{item.best_price.toFixed(2)}</div>}
              <div className="text-xs" style={{ color:"var(--green)" }}>{item.in_stock_count} retailer{item.in_stock_count!==1?"s":""}</div>
            </div>
            <span className="text-brand-500 font-semibold text-sm flex-shrink-0">View →</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
