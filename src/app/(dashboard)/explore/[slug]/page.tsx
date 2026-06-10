
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductHero }        from "@/components/products/ProductHero"
import { RetailerStockTable } from "@/components/products/RetailerStockTable"
import { PriceHistoryChart }  from "@/components/products/PriceHistoryChart"
import { StockHistory }       from "@/components/products/StockHistory"
import { WatchButton }        from "@/components/watchlist/WatchButton"

interface P {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ id?: string }>
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const supabase = await createClient()
  const { slug } = params
  const { data } = await supabase.from("v_products").select("name,set_name").eq("slug", slug).single()
  return { title: data ? `${data.name}${data.set_name ? ` — ${data.set_name}` : ""}` : "Product" }
}

export default async function ProductPage({ params, searchParams }: P) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { slug } = await params
const sp = searchParams ? await searchParams : {}
const id = sp.id

let productQuery = supabase
  .from("v_products")
  .select("*")

if (id) {
  productQuery = productQuery.eq("id", id)
} else {
  productQuery = productQuery.eq("slug", slug)
}

const { data: product, error: productError } = await productQuery.maybeSingle()

if (productError || !product) {
  console.error("Product not found", { slug, id, productError })
  notFound()
}
const watchlistRes = user
  ? await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle()
  : { data: null }

  const [retailersRes, priceHistRes, eventsRes] = await Promise.all([
    supabase.from("retailer_products").select("*, retailer:retailers(*)")
      .eq("product_id", product.id).eq("is_active", true)
      .order("current_price", { ascending: true, nullsFirst: false }),
    user ? supabase.from("price_history")
      .select("price,recorded_at,retailer_id,retailer:retailers(name)")
      .eq("product_id", product.id)
      .gte("recorded_at", new Date(Date.now()-30*86400000).toISOString())
      .order("recorded_at") : Promise.resolve({ data: [] }),
    supabase.from("stock_events")
      .select("*, retailer:retailers(name,slug)")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false }).limit(30),
  ])

  // Increment view count (fire and forget)
  supabase.from("products").update({ view_count: (product.view_count||0)+1 }).eq("id", product.id).then()

  const canSeeHistory = !!user  // free users see 7 days; premium sees 30

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 fade-in">
      <ProductHero product={product}>
        {user && <WatchButton productId={product.id} userId={user.id} currentItem={watchlistRes.data} />}
      </ProductHero>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <RetailerStockTable retailers={retailersRes.data ?? []} />
          {canSeeHistory && (priceHistRes.data ?? []).length > 0 && (
           <PriceHistoryChart data={(priceHistRes.data ?? []) as any} />
          )}
          {(eventsRes.data ?? []).length > 0 && <StockHistory events={eventsRes.data ?? []} />}
        </div>
        <div className="space-y-4">
          <div className="card p-5 space-y-3">
            <h3 className="section-title">Product Details</h3>
            {[
              ["Category",  product.category_name],
              ["Set",       product.set_name],
              ["Series",    product.series],
              ["Type",      product.product_type],
              ["RRP",       product.rrp_gbp ? `£${product.rrp_gbp.toFixed(2)}` : null],
              ["Release",   product.release_date ? new Date(product.release_date).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) : null],
              ["Best Price",product.best_price ? `£${product.best_price.toFixed(2)}` : null],
              ["In Stock",  `${product.in_stock_count} of ${product.retailer_count} retailers`],
            ].map(([l,v]) => v ? (
              <div key={String(l)} className="flex justify-between text-sm">
                <span style={{ color:"var(--muted)" }}>{l}</span>
                <span className="font-semibold" style={{ color:"var(--text)" }}>{v}</span>
              </div>
            ) : null)}
          </div>
          {product.demand_score > 0 && (
            <div className="card p-5">
              <h3 className="section-title">Demand Score</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background:"var(--border)" }}>
                  <div className="h-full rounded-full" style={{
                    width:`${product.demand_score}%`,
                    background: product.demand_score > 70 ? "var(--green)" : product.demand_score > 40 ? "var(--yellow)" : "var(--muted)",
                  }} />
                </div>
                <span className="text-lg font-black" style={{ color:"var(--text)" }}>{product.demand_score}</span>
              </div>
              <p className="text-xs mt-2" style={{ color:"var(--muted)" }}>
                Based on {product.watchlist_count} watchers and restock frequency
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
