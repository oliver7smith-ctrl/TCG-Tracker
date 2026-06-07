
"use client"
import { useState } from "react"
import Link from "next/link"
import type { WatchlistWithStatus, Retailer } from "@/types"
import { formatPrice, timeAgo } from "@/lib/utils/format"

interface Props { watchlist:WatchlistWithStatus[]; userId:string; retailers:Pick<Retailer,"id"|"name"|"slug">[] }
type Filter = "all"|"in_stock"|"sold_out"|"high"

export function WatchlistView({ watchlist }: Props) {
  const [filter, setFilter] = useState<Filter>("all")
  const [removing, setRemoving] = useState<string|null>(null)
  const [items, setItems] = useState(watchlist)

  const filtered = items.filter(w =>
    filter==="in_stock" ? w.in_stock_count>0 :
    filter==="sold_out" ? w.in_stock_count===0 :
    filter==="high"     ? w.priority==="high" : true
  )

  async function remove(item: WatchlistWithStatus) {
    setRemoving(item.id)
    try {
      await fetch("/api/watchlist", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({product_id:item.product_id}) })
      setItems(p => p.filter(i => i.id !== item.id))
    } finally { setRemoving(null) }
  }

  const tabs = [
    { v:"all" as Filter,      l:`All (${items.length})` },
    { v:"in_stock" as Filter, l:`In Stock (${items.filter(w=>w.in_stock_count>0).length})` },
    { v:"sold_out" as Filter, l:`Sold Out (${items.filter(w=>w.in_stock_count===0).length})` },
    { v:"high" as Filter,     l:"Priority" },
  ]

  if (!items.length) {
    return (
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">❤️</div>
        <h3 className="text-lg font-bold mb-2" style={{ color:"var(--text)" }}>Nothing tracked yet</h3>
        <p className="text-sm mb-6" style={{ color:"var(--muted)" }}>Search for a product and click &ldquo;Track&rdquo; to start.</p>
        <Link href="/explore" className="btn-primary btn-md inline-flex">Explore products →</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.v} onClick={()=>setFilter(t.v)} className={`btn-sm ${filter===t.v?"btn-primary":"btn-secondary"}`}>{t.l}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(item => {
          const inStock = item.in_stock_count > 0
          return (
            <div key={item.id} className="card p-5" style={inStock ? { borderColor:"rgba(16,185,129,0.3)" } : {}}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl overflow-hidden" style={{ background:"var(--surface2)" }}>
                  {item.image_url ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-contain p-1" /> : "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link href={`/explore/${item.product_id}`} className="font-bold text-sm hover:underline truncate" style={{ color:"var(--text)" }}>{item.product_name}</Link>
                    <div className={`badge text-xs py-0.5 flex-shrink-0 ${inStock ? "badge-green" : "badge-gray"}`}>
                      {inStock ? <><span className="pulse-dot w-1.5 h-1.5" />In Stock</> : "Sold Out"}
                    </div>
                  </div>
                  <div className="text-xs mb-2" style={{ color:"var(--muted)" }}>
                    {item.category_icon} {item.set_name} · {item.product_type}
                    {item.max_price && <span className="ml-2">· Max {formatPrice(item.max_price)}</span>}
                    {item.priority!=="medium" && <span className="ml-2">· {item.priority} priority</span>}
                  </div>
                  {inStock && item.best_price != null && (
                    <div className="text-base font-black" style={{ color:"var(--green)" }}>
                      From {formatPrice(item.best_price)} · {item.in_stock_count} retailer{item.in_stock_count!==1?"s":""}
                    </div>
                  )}
                  {!inStock && item.last_in_stock_at && (
                    <div className="text-xs" style={{ color:"var(--dim)" }}>Last in stock {timeAgo(item.last_in_stock_at)}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t flex-wrap" style={{ borderColor:"var(--border)" }}>
                <Link href={`/explore/${item.product_id}`} className={`btn-sm ${inStock ? "btn-success" : "btn-secondary"}`}>
                  {inStock ? "⚡ View in-stock retailers" : "View product"}
                </Link>
                <button onClick={()=>remove(item)} disabled={removing===item.id} className="btn-danger btn-sm ml-auto">
                  {removing===item.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
