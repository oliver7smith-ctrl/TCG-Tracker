
"use client"
import { useState } from "react"
import Link from "next/link"
import type { CollectionItem } from "@/types"
import { formatPrice, timeAgo } from "@/lib/utils/format"

interface Props { items: CollectionItem[]; userId: string; tier: string }

export function CollectionView({ items: initial, tier }: Props) {
  const [items, setItems] = useState(initial)
  const [removing, setRemoving] = useState<string|null>(null)
  const [filter, setFilter] = useState("all")

  const categories = Array.from(new Set(items.map(i => {
    const p = i.product as { category?: { name?: string } } | undefined
    return p?.category?.name ?? "Other"
  })))

  const filtered = filter==="all" ? items : items.filter(i => {
    const p = i.product as { category?: { name?: string } } | undefined
    return p?.category?.name === filter
  })

  async function remove(id: string) {
    setRemoving(id)
    try {
      await fetch(`/api/collection/${id}`, { method:"DELETE" })
      setItems(p => p.filter(i => i.id !== id))
    } finally { setRemoving(null) }
  }

  if (!items.length) {
    return (
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">📦</div>
        <h3 className="text-lg font-bold mb-2" style={{ color:"var(--text)" }}>Your collection is empty</h3>
        <p className="text-sm mb-6" style={{ color:"var(--muted)" }}>Add items you own to track their value and performance.</p>
        <Link href="/explore" className="btn-primary btn-md inline-flex">Browse products →</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={()=>setFilter("all")} className={`btn-sm ${filter==="all"?"btn-primary":"btn-secondary"}`}>All ({items.length})</button>
          {categories.map(c => (
            <button key={c} onClick={()=>setFilter(c)}
              className={`btn-sm ${filter===c?"btn-primary":"btn-secondary"}`}>
              {c} ({items.filter(i => { const p=i.product as {category?:{name?:string}}|undefined; return (p?.category?.name??'Other')===c }).length})
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(item => {
          const prod = item.product as { name?: string; slug?: string; image_url?: string; set_name?: string; product_type?: string; category?: { name?: string; icon_emoji?: string; color?: string } } | undefined
          const pnl  = item.current_value_total != null && item.purchase_price_total != null
            ? item.current_value_total - item.purchase_price_total : null

          return (
            <div key={item.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background:"var(--surface2)" }}>
                  {prod?.image_url ? <img src={prod.image_url} alt={prod.name} className="w-full h-full object-contain p-1" /> : <span className="text-2xl">📦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/explore/${prod?.slug ?? item.product_id}`} className="font-bold text-sm hover:underline" style={{ color:"var(--text)" }}>
                    {prod?.name ?? "Unknown Product"}
                  </Link>
                  <div className="text-xs mt-0.5" style={{ color:"var(--muted)" }}>
                    {prod?.category?.icon_emoji} {prod?.set_name} · {prod?.product_type}
                    {item.condition && <span className="ml-2 capitalize">· {item.condition.replace("_"," ")}</span>}
                    {item.grade && <span className="ml-2">· {item.grading_company} {item.grade}</span>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                    <div>
                      <div className="text-xs" style={{ color:"var(--dim)" }}>Quantity</div>
                      <div className="text-sm font-bold" style={{ color:"var(--text)" }}>{item.quantity_owned}</div>
                    </div>
                    {item.purchase_price_total != null && (
                      <div>
                        <div className="text-xs" style={{ color:"var(--dim)" }}>Paid</div>
                        <div className="text-sm font-bold" style={{ color:"var(--text)" }}>{formatPrice(item.purchase_price_total)}</div>
                      </div>
                    )}
                    {item.current_value_total != null && (
                      <div>
                        <div className="text-xs" style={{ color:"var(--dim)" }}>Value</div>
                        <div className="text-sm font-bold" style={{ color:"var(--green)" }}>{formatPrice(item.current_value_total)}</div>
                      </div>
                    )}
                    {pnl != null && (
                      <div>
                        <div className="text-xs" style={{ color:"var(--dim)" }}>P&amp;L</div>
                        <div className={`text-sm font-bold ${pnl >= 0 ? "text-gain" : "text-loss"}`}>
                          {pnl >= 0 ? "+" : ""}{formatPrice(pnl)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t flex-wrap" style={{ borderColor:"var(--border)" }}>
                {tier !== "free" && <button className="btn-secondary btn-sm">Edit</button>}
                <button onClick={()=>remove(item.id)} disabled={removing===item.id} className="btn-danger btn-sm ml-auto">
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
