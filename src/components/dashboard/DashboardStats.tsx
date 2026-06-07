
import type { WatchlistWithStatus, StockEvent } from "@/types"
interface Props { watchlist:WatchlistWithStatus[]; events:StockEvent[]; portfolioValue:number }
export function DashboardStats({ watchlist, events, portfolioValue }: Props) {
  const inStock    = watchlist.filter(w => w.in_stock_count > 0).length
  const restocks24 = events.filter(e => e.event_type === "in_stock").length
  const priceDrops = events.filter(e => e.event_type === "price_drop").length
  const stats = [
    { label:"Tracked",        value: watchlist.length.toString(),       icon:"📦", color:"var(--primary)",bg:"rgba(124,58,237,0.08)" },
    { label:"In Stock",       value: inStock.toString(),                 icon:"✅", color:"var(--green)",  bg:"var(--green-s)" },
    { label:"Restocks (24h)", value: restocks24.toString(),              icon:"⚡", color:"var(--yellow)", bg:"rgba(217,119,6,0.08)" },
    { label:"Collection Value",value: portfolioValue > 0 ? `£${portfolioValue.toFixed(2)}` : "—", icon:"💹", color:"var(--blue)",   bg:"rgba(37,99,235,0.08)" },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="card p-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background:s.bg }}>{s.icon}</div>
          <div className="text-2xl font-black leading-none" style={{ color:s.color }}>{s.value}</div>
          <div className="text-xs mt-1 font-medium" style={{ color:"var(--muted)" }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}
