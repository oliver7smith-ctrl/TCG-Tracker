
"use client"
import { useState } from "react"
import type { WatchlistItem } from "@/types"

interface Props { productId:string; userId:string; currentItem:WatchlistItem|null }

export function WatchButton({ productId, currentItem }: Props) {
  const [item, setItem]   = useState(currentItem)
  const [loading, setLoading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [maxPrice, setMaxPrice] = useState(currentItem?.max_price?.toString() ?? "")
  const [priority, setPriority] = useState<"high"|"medium"|"low">(currentItem?.priority ?? "medium")
  const [limitErr, setLimitErr] = useState(false)

  async function toggle() {
    setLoading(true); setLimitErr(false)
    try {
      if (item) {
        await fetch("/api/watchlist", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({product_id:productId}) })
        setItem(null)
      } else {
        const res  = await fetch("/api/watchlist", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({product_id:productId, priority}) })
        const data = await res.json()
        if (data.code === "LIMIT_REACHED") { setLimitErr(true); return }
        setItem(data)
      }
    } finally { setLoading(false) }
  }

  async function savePrefs() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/watchlist/${item!.id}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ max_price: maxPrice ? parseFloat(maxPrice) : null, priority }),
      })
      const data = await res.json()
      setItem(data); setShowEdit(false)
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <button onClick={toggle} disabled={loading}
        className={`btn-md min-w-[150px] ${item ? "btn-secondary" : "btn-primary"}`}>
        {loading ? "…" : item ? "✓ Tracking this product" : "Track this product"}
      </button>
      {item && (
        <button onClick={() => setShowEdit(v => !v)} className="btn-secondary btn-md">
          ⚙️ Alert settings
        </button>
      )}
      {limitErr && (
        <p className="w-full text-sm" style={{ color:"var(--red)" }}>
          Watchlist full. <a href="/settings?tab=billing" className="underline">Upgrade to Premium</a> for unlimited tracking.
        </p>
      )}
      {showEdit && (
        <div className="w-full card p-5 mt-2 slide-up">
          <h3 className="font-bold text-sm mb-4" style={{ color:"var(--text)" }}>Alert Preferences</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:"var(--muted)" }}>Max price (£)</label>
              <input className="input" type="number" min="0" step="0.01" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="No limit" />
              <p className="text-xs mt-1" style={{ color:"var(--dim)" }}>Only alert me if price is at or below this</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:"var(--muted)" }}>Check priority</label>
              <select className="input" value={priority} onChange={e=>setPriority(e.target.value as "high"|"medium"|"low")}>
                <option value="high">High — every 2 min</option>
                <option value="medium">Medium — every 5 min</option>
                <option value="low">Low — every 15 min</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={savePrefs} disabled={loading} className="btn-primary btn-sm">{loading?"Saving…":"Save"}</button>
            <button onClick={() => setShowEdit(false)} className="btn-ghost btn-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
