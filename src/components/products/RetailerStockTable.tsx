
import type { RetailerProduct, Retailer } from "@/types"
import { formatPrice, timeAgo } from "@/lib/utils/format"

type Row = RetailerProduct & { retailer: Retailer }

const STATUS: Record<string, { label:string; badge:string; dot:string }> = {
  in_stock:    { label:"In Stock",    badge:"badge-green",  dot:"#10b981" },
  sold_out:    { label:"Sold Out",    badge:"badge-red",    dot:"#ef4444" },
  preorder:    { label:"Pre-order",   badge:"badge-blue",   dot:"#3b82f6" },
  backorder:   { label:"Backorder",   badge:"badge-yellow", dot:"#f59e0b" },
  unavailable: { label:"Unavailable", badge:"badge-gray",   dot:"#94a3b8" },
  unknown:     { label:"Unknown",     badge:"badge-gray",   dot:"#94a3b8" },
}

export function RetailerStockTable({ retailers }: { retailers: Row[] }) {
  if (!retailers.length) {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-3">🏪</div>
        <div className="font-semibold" style={{ color:"var(--text)" }}>No retailers linked</div>
        <div className="text-sm mt-1" style={{ color:"var(--muted)" }}>An admin needs to add product URLs for this item.</div>
      </div>
    )
  }
  const sorted = [...retailers].sort((a,b) => {
    if (a.current_stock_status==="in_stock" && b.current_stock_status!=="in_stock") return -1
    if (b.current_stock_status==="in_stock" && a.current_stock_status!=="in_stock") return 1
    if (a.current_price!=null && b.current_price!=null) return a.current_price - b.current_price
    return 0
  })
  return (
    <section>
      <h2 className="section-title">Retailers ({retailers.length})</h2>
      <div className="card overflow-hidden">
        {/* Mobile */}
        <div className="sm:hidden divide-y" style={{ borderColor:"var(--border)" }}>
          {sorted.map(r => {
            const cfg = STATUS[r.current_stock_status] ?? STATUS.unknown
            const url = r.fast_buy_url || r.product_url
            return (
              <div key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color:"var(--text)" }}>{r.retailer.name}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`badge ${cfg.badge} text-xs py-0.5`}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:cfg.dot }} />{cfg.label}
                      </span>
                      {r.current_price!=null && <span className="text-sm font-black" style={{ color:r.current_stock_status==="in_stock"?"var(--green)":"var(--text)" }}>{formatPrice(r.current_price)}</span>}
                    </div>
                    <div className="text-xs mt-1" style={{ color:"var(--dim)" }}>Checked {timeAgo(r.last_checked_at)}</div>
                  </div>
                  {r.current_stock_status==="in_stock"
                    ? <a href={url} target="_blank" rel="noopener noreferrer" className="btn-success btn-sm flex-shrink-0">{r.fast_buy_url ? "⚡ Buy" : "View →"}</a>
                    : <a href={r.product_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm flex-shrink-0">View</a>}
                </div>
              </div>
            )
          })}
        </div>
        {/* Desktop */}
        <table className="w-full hidden sm:table">
          <thead>
            <tr className="border-b" style={{ borderColor:"var(--border)" }}>
              {["Retailer","Status","Price","Reliability","Checked","Action"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color:"var(--dim)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor:"var(--border)" }}>
            {sorted.map(r => {
              const cfg = STATUS[r.current_stock_status] ?? STATUS.unknown
              const url = r.fast_buy_url || r.product_url
              return (
                <tr key={r.id} className="hover:opacity-80 transition-opacity">
                  <td className="px-4 py-3 font-semibold text-sm" style={{ color:"var(--text)" }}>{r.retailer.name}</td>
                  <td className="px-4 py-3"><span className={`badge ${cfg.badge}`}><span className="w-1.5 h-1.5 rounded-full" style={{ background:cfg.dot }} />{cfg.label}</span></td>
                  <td className="px-4 py-3 font-black text-sm" style={{ color:r.current_stock_status==="in_stock"?"var(--green)":"var(--text)" }}>{r.current_price!=null ? formatPrice(r.current_price) : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background:"var(--border)" }}>
                        <div className="h-full rounded-full" style={{ width:`${r.retailer.reliability_score}%`, background:r.retailer.reliability_score>=80?"#10b981":r.retailer.reliability_score>=60?"#f59e0b":"#ef4444" }} />
                      </div>
                      <span className="text-xs" style={{ color:"var(--dim)" }}>{r.retailer.reliability_score}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color:"var(--dim)" }}>{timeAgo(r.last_checked_at)}</td>
                  <td className="px-4 py-3">
                    {r.current_stock_status==="in_stock"
                      ? <a href={url} target="_blank" rel="noopener noreferrer" className="btn-success btn-xs">{r.fast_buy_url?"⚡ Buy Now":"View →"}</a>
                      : <a href={r.product_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-xs">View</a>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
