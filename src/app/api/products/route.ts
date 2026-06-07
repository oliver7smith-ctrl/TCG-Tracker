
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  const sp = req.nextUrl.searchParams
  const { data, error } = await supabase.rpc("search_products", {
    p_query:    sp.get("q") || null,
    p_category: sp.get("category") || null,
    p_type:     sp.get("type") || null,
    p_in_stock: sp.get("in_stock") === "1" || null,
    p_limit:    Math.min(parseInt(sp.get("limit")||"20"), 50),
    p_offset:   parseInt(sp.get("offset")||"0"),
    p_sort:     sp.get("sort") || "relevance",
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
