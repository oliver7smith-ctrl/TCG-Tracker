
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { ProductGrid }   from "@/components/products/ProductGrid"
import { SearchFilters } from "@/components/products/SearchFilters"

export const metadata: Metadata = { title: "Explore" }

interface P { searchParams: Promise<{ q?:string;category?:string;type?:string;in_stock?:string;sort?:string;page?:string }> }

export default async function ExplorePage({ searchParams }: P) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const sp = await searchParams
  const q       = sp.q        || null
  const category= sp.category || null
  const type    = sp.type     || null
  const inStock = sp.in_stock === "1" || null
  const sort    = sp.sort     || "relevance"
  const page    = parseInt(sp.page || "1")
  const pageSize= 24

  const [categoriesRes, productsRes, watchlistRes] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.rpc("search_products", {
      p_query: q, p_category: category, p_type: type,
      p_in_stock: inStock, p_limit: pageSize, p_offset: (page-1)*pageSize, p_sort: sort,
    }),
    user ? supabase.from("watchlist").select("product_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
  ])

  const watchlistIds = new Set((watchlistRes.data ?? []).map((w: { product_id: string }) => w.product_id))

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 fade-in">
      <div className="mb-6">
        <h1 className="page-title">Explore</h1>
        <p className="page-sub">Search across all collectible categories</p>
      </div>
      <SearchFilters categories={categoriesRes.data ?? []} />
      <ProductGrid products={productsRes.data ?? []} watchlistIds={watchlistIds} userId={user?.id} />
    </div>
  )
}
