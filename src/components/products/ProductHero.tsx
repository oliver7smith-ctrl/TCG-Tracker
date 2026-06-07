
import type { ProductWithAvailability } from "@/types"
import { formatPrice, timeAgo } from "@/lib/utils/format"
interface Props { product: ProductWithAvailability; children?: React.ReactNode }
export function ProductHero({ product, children }: Props) {
  const inStock = product.in_stock_count > 0
  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="w-full sm:w-44 h-44 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background:"var(--surface2)" }}>
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain p-3" />
            : <span className="text-6xl opacity-20">📦</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="badge badge-purple text-xs">{product.category_icon} {product.category_name}</span>
            <span className="text-xs font-medium" style={{ color:"var(--muted)" }}>{product.product_type}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-1" style={{ color:"var(--text)" }}>{product.name}</h1>
          {product.set_name && <p className="text-sm mb-4" style={{ color:"var(--muted)" }}>{product.set_name}{product.set_code ? ` (${product.set_code})` : ""}</p>}
          <div className="flex items-end gap-6 mb-5 flex-wrap">
            <div>
              <div className="text-xs font-medium mb-0.5" style={{ color:"var(--dim)" }}>{inStock ? "Best price" : "RRP"}</div>
              <div className="text-3xl font-black" style={{ color: inStock ? "var(--green)" : "var(--muted)" }}>
                {inStock && product.best_price != null ? formatPrice(product.best_price) : product.rrp_gbp != null ? formatPrice(product.rrp_gbp) : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium mb-0.5" style={{ color:"var(--dim)" }}>Status</div>
              {inStock
                ? <div className="flex items-center gap-2"><div className="pulse-dot" /><span className="font-bold text-sm" style={{ color:"var(--green)" }}>In stock · {product.in_stock_count} retailer{product.in_stock_count!==1?"s":""}</span></div>
                : <span className="font-semibold text-sm" style={{ color:"var(--red)" }}>Sold out</span>}
            </div>
            {product.last_in_stock_at && !inStock && (
              <div>
                <div className="text-xs font-medium mb-0.5" style={{ color:"var(--dim)" }}>Last in stock</div>
                <div className="text-sm font-semibold" style={{ color:"var(--muted)" }}>{timeAgo(product.last_in_stock_at)}</div>
              </div>
            )}
            {product.demand_score > 0 && (
              <div>
                <div className="text-xs font-medium mb-0.5" style={{ color:"var(--dim)" }}>Demand</div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-20 rounded-full overflow-hidden" style={{ background:"var(--border)" }}>
                    <div className="h-full rounded-full" style={{ width:`${product.demand_score}%`, background: product.demand_score>70?"var(--green)":product.demand_score>40?"var(--yellow)":"var(--muted)" }} />
                  </div>
                  <span className="text-sm font-bold" style={{ color:"var(--text)" }}>{product.demand_score}</span>
                </div>
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
