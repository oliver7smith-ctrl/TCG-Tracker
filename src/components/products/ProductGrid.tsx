
"use client"
import Link from "next/link"
import { useState } from "react"
import type { ProductWithAvailability } from "@/types"
import { formatPrice, timeAgo } from "@/lib/utils/format"

interface Props {
  products: ProductWithAvailability[]
  watchlistIds: Set<string>
  userId?: string
}

export function ProductGrid({ products, watchlistIds: init, userId }: Props) {
  const [tracked, setTracked] = useState(new Set(init))
  const [adding, setAdding]   = useState<string | null>(null)
  const [limitErr, setLimitErr] = useState(false)

  async function track(productId: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (!userId) return
    setAdding(productId); setLimitErr(false)
    try {
      if (tracked.has(productId)) {
        await fetch("/api/watchlist", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({product_id:productId}) })
        setTracked(p => { const n = new Set(p); n.delete(productId); return n })
      } else {
        const res  = await fetch("/api/watchlist", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({product_id:productId}) })
        const data = await res.json()
        if (data.code === "LIMIT_REACHED") { setLimitErr(true); return }
        setTracked(p => new Set([...p, productId]))
      }
    } finally { setAdding(null) }
  }

  if (!products.length) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📦</div>
        <h3 className="text-lg font-bold mb-2" style={{ color:"var(--text)" }}>No products found</h3>
        <p className="text-sm" style={{ color:"var(--muted)" }}>Try a different search or clear your filters</p>
      </div>
    )
  }

  return (
    <>
      {limitErr && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-sm" style={{ background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.2)", color:"var(--red)" }}>
          Watchlist full. <a href="/settings?tab=billing" className="underline font-semibold">Upgrade to Premium</a> for more slots.
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map(p => {
          const inStock   = p.in_stock_count > 0
          const isTracked = tracked.has(p.id)
          return (
            <Link key={p.id} href={`/explore/${p.slug}?id=${p.id}`}
              className="card overflow-hidden hover:border-brand-500/30 transition-all hover:shadow-card-hover group cursor-pointer">
              <div className="relative h-36 flex items-center justify-center overflow-hidden" style={{ background:"var(--surface2)" }}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className="max-h-full max-w-full object-contain p-3" loading="lazy" />
                  : <span className="text-5xl opacity-20">📦</span>}
                {inStock && (
                  <div className="absolute top-2 right-2 badge badge-green py-0.5 text-xs">
                    <span className="pulse-dot w-1.5 h-1.5" />In Stock
                  </div>
                )}
                {p.demand_score > 80 && <div className="absolute top-2 left-2 badge badge-yellow py-0.5 text-xs">🔥 Hot</div>}
              </div>
              <div className="p-3">
                <div className="text-xs mb-0.5 truncate" style={{ color:"var(--muted)" }}>{p.category_icon} {p.set_name ?? p.category_name}</div>
                <div className="text-sm font-bold leading-snug mb-2 line-clamp-2" style={{ color:"var(--text)" }}>{p.name}</div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    {inStock && p.best_price != null
                      ? <div className="text-sm font-black" style={{ color:"var(--green)" }}>{formatPrice(p.best_price)}</div>
                      : <div className="text-xs" style={{ color:"var(--dim)" }}>{p.rrp_gbp ? `RRP ${formatPrice(p.rrp_gbp)}` : "—"}</div>}
                    <div className="text-xs" style={{ color:"var(--dim)" }}>
                      {inStock ? `${p.in_stock_count} retailer${p.in_stock_count!==1?"s":""}` : p.last_in_stock_at ? `Last ${timeAgo(p.last_in_stock_at)}` : "No data"}
                    </div>
                  </div>
                  {userId && (
                    <button onClick={e => track(p.id, e)} disabled={adding === p.id}
                      className={`btn-xs flex-shrink-0 ${isTracked ? "btn-secondary" : "btn-primary"}`}>
                      {adding === p.id ? "…" : isTracked ? "✓" : "+"}
                    </button>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
