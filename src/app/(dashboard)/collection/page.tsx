
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { CollectionView } from "@/components/collection/CollectionView"
import Link from "next/link"

export const metadata: Metadata = { title: "My Collection" }

export default async function CollectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [collectionRes, profileRes] = await Promise.all([
    supabase.from("collection")
      .select("*, product:products(*, category:categories(name,slug,color,icon_emoji))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("subscription_tier,collection_count").eq("id", user.id).single(),
  ])

  const collection = collectionRes.data ?? []
  const profile    = profileRes.data

  const totalValue   = collection.reduce((s, i) => s + (i.current_value_total  ?? 0), 0)
  const totalCost    = collection.reduce((s, i) => s + (i.purchase_price_total  ?? 0), 0)
  const totalItems   = collection.reduce((s, i) => s + i.quantity_owned, 0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 fade-in">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">My Collection</h1>
          <p className="page-sub">{totalItems} items · {collection.length} unique products</p>
        </div>
        <div className="flex gap-3">
          <Link href="/collection/add" className="btn-primary btn-sm">+ Add Item</Link>
        </div>
      </div>

      {/* Collection stats */}
      {collection.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label:"Total Items",   value: totalItems.toString(),                     color:"var(--primary)" },
            { label:"Collection Value", value:`£${totalValue.toFixed(2)}`,              color:"var(--green)" },
            { label:"Total Invested",   value:`£${totalCost.toFixed(2)}`,               color:"var(--text)" },
            { label:"Unrealised P&L",   value:`${totalValue-totalCost >= 0 ? "+" : ""}£${(totalValue-totalCost).toFixed(2)}`,
              color: totalValue >= totalCost ? "var(--green)" : "var(--red)" },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color:"var(--muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <CollectionView
        items={collection}
        userId={user.id}
        tier={profile?.subscription_tier ?? "free"}
      />
    </div>
  )
}
