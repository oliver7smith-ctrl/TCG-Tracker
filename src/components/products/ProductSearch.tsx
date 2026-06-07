
"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { ProductWithAvailability } from "@/types"
import { formatPrice, timeAgo } from "@/lib/utils/format"

interface Props { userId: string; watchlistProductIds: string[] }

export function ProductSearch({ userId, watchlistProductIds }: Props) {
  const [query, setQuery]     = useState("")
  const [results, setResults] = useState<ProductWithAvailability[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const [tracked, setTracked] = useState(new Set(watchlistProductIds))
  const [adding, setAdding]   = useState<string | null>(null)
  const [limitErr, setLimitErr] = useState(false)
  const ref    = useRef<HTMLDivElement>(null)
  const timer  = useRef<ReturnType<typeof setTimeout>>()
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=8`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(query), 220)
    return () => clearTimeout(timer.current)
  }, [query, search])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  async function track(productId: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
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

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔍</span>
        <input className="input pl-11 text-base py-3.5"
          value={query} placeholder="Search products — e.g. Prismatic Evolutions ETB, PE SPC…"
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)} />
        {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />}
      </div>

      {limitErr && (
        <div className="mt-2 px-4 py-2.5 rounded-xl text-sm" style={{ background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.2)", color:"var(--red)" }}>
          Watchlist full. <a href="/settings?tab=billing" className="underline font-semibold">Upgrade to Premium</a> for unlimited tracking.
        </div>
      )}

      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 card shadow-2xl overflow-hidden slide-up max-h-[30rem] overflow-y-auto">
          {!results.length && !loading && (
            <div className="px-5 py-8 text-center">
              <div className="text-3xl mb-2">🔍</div>
              <div className="font-semibold text-sm mb-1" style={{ color:"var(--text)" }}>No results for &ldquo;{query}&rdquo;</div>
              <div className="text-xs" style={{ color:"var(--muted)" }}>
                Try a different name or <button onClick={() => { setOpen(false); router.push(`/explore?q=${encodeURIComponent(query)}`) }} className="underline" style={{ color:"var(--primary)" }}>browse all products</button>
              </div>
            </div>
          )}
          {results.map((p, i) => {
            const isTracked = tracked.has(p.id)
            const inStock   = p.in_stock_count > 0
            return (
              <div key={p.id}
                className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer hover:opacity-80 transition-opacity ${i < results.length-1 ? "border-b" : ""}`}
                style={{ borderColor:"var(--border)" }}
                onClick={() => { setOpen(false); router.push(`/explore/${p.slug}`) }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color:"var(--text)" }}>{p.name}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs" style={{ color:"var(--muted)" }}>{p.set_name} · {p.product_type}</span>
                    {inStock
                      ? <span className="badge badge-green text-xs py-0.5"><span className="pulse-dot w-1.5 h-1.5" />From {formatPrice(p.best_price)}</span>
                      : <span className="badge badge-gray text-xs py-0.5">Sold out</span>}
                    {p.demand_score > 70 && <span className="badge badge-yellow text-xs py-0.5">🔥 High demand</span>}
                  </div>
                </div>
                <button onClick={e => track(p.id, e)} disabled={adding === p.id}
                  className={`btn-xs flex-shrink-0 ${isTracked ? "btn-secondary" : "btn-primary"}`}>
                  {adding === p.id ? "…" : isTracked ? "✓ Tracking" : "+ Track"}
                </button>
              </div>
            )
          })}
          {results.length > 0 && (
            <button onClick={() => { setOpen(false); router.push(`/explore?q=${encodeURIComponent(query)}`) }}
              className="w-full px-4 py-3 text-xs font-semibold text-center border-t hover:opacity-80 transition-opacity"
              style={{ color:"var(--primary)", borderColor:"var(--border)", background:"var(--surface2)" }}>
              See all results for &ldquo;{query}&rdquo; →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
