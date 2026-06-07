
"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import type { Category } from "@/types"

const TYPES = ["Elite Trainer Box","Booster Box","Booster Bundle","Booster Pack","Collection Box","Premium Collection","Tin","Mini Tin","Blister","Starter Deck","Theme Deck","Gift Set"]

export function SearchFilters({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const sp     = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value); else params.delete(key)
    params.delete("page")
    router.push(`/explore?${params.toString()}`)
  }, [router, sp])

  const q       = sp.get("q") ?? ""
  const category= sp.get("category") ?? ""
  const type    = sp.get("type") ?? ""
  const inStock = sp.get("in_stock") === "1"
  const sort    = sp.get("sort") ?? ""
  const active  = q || category || type || inStock || sort

  return (
    <div className="space-y-3 mb-6">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">🔍</span>
        <input className="input pl-11 text-base" defaultValue={q}
          placeholder="Search products, sets, types…"
          onKeyDown={e => { if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value) }}
          onChange={e => { if (!e.target.value) update("q", "") }} />
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => update("in_stock", inStock ? "" : "1")}
          className={`btn-sm ${inStock ? "btn-success" : "btn-secondary"}`}>
          {inStock ? "✅ In Stock" : "In Stock Only"}
        </button>
        <select className="input !w-auto py-2 text-sm cursor-pointer" value={category} onChange={e => update("category", e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{c.icon_emoji} {c.name}</option>)}
        </select>
        <select className="input !w-auto py-2 text-sm cursor-pointer" value={type} onChange={e => update("type", e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input !w-auto py-2 text-sm cursor-pointer" value={sort} onChange={e => update("sort", e.target.value)}>
          <option value="">Most Relevant</option>
          <option value="demand">Most Wanted</option>
          <option value="price_asc">Lowest Price</option>
          <option value="price_desc">Highest Price</option>
          <option value="newest">Newest First</option>
        </select>
        {active && (
          <button onClick={() => router.push("/explore")} className="btn-ghost btn-sm" style={{ color:"var(--red)" }}>✕ Clear</button>
        )}
      </div>
    </div>
  )
}
