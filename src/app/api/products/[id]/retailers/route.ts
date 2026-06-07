
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
export async function GET(_req: NextRequest, { params }: { params: Promise<{id:string}> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const { id } = await params
  const { data, error } = await supabase.from("retailer_products")
    .select("*, retailer:retailers(*)")
    .eq("product_id", id).eq("is_active", true)
    .order("current_price", { ascending: true, nullsFirst: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
