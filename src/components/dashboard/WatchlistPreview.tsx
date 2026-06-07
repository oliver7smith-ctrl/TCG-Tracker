
import Link from "next/link"
import type { WatchlistWithStatus } from "@/types"
import { timeAgo, formatPrice } from "@/lib/utils/format"
interface Props { watchlist:WatchlistWithStatus[]; userId:string }
export function WatchlistPreview({ watchlist }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title mb-0">Watchlist</h2>
        <Link href="/watchlist" className="text-xs font-semibold" style={{ color:"var(--primary)" }}>See all →</Link>
      </div>
      {watchlist.length === 0 ? (
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">❤️</div>
          <div className="text-sm font-semibold mb-1" style={{ color:"var(--text)" }}>Nothing tracked</div>
          <Link href="/explore" className="text-xs" style={{ color:"var(--primary)" }}>Search products →</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {watchlist.map((item,i) => {
            const inStock = item.in_stock_count > 0
            return (
              <Link key={item.id} href={`/explore/${item.product_id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:opacity-80 transition-opacity ${i<watchlist.length-1?"border-b":""}`}
                style={{ borderColor:"var(--border)" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color:"var(--text)" }}>{item.product_name}</div>
                  <div className="text-xs mt-0.5" style={{ color:"var(--dim)" }}>
                    {inStock ? <span style={{ color:"var(--green)" }}>{formatPrice(item.best_price)}</span>
                              : item.last_in_stock_at ? `Last ${timeAgo(item.last_in_stock_at)}` : "Not in stock"}
                  </div>
                </div>
                {inStock && <div className="pulse-dot flex-shrink-0" />}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
