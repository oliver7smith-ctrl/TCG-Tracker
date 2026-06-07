
import type { StockCheckResult } from "@/types"

interface Variant { id: number; available: boolean; price: string }
interface ShopifyProduct { variants: Variant[] }

function toJsonUrl(url: string): string {
  try {
    const u = new URL(url)
    return `${u.origin}${u.pathname.replace(/\.json$/, "").replace(/\/$/, "")}.json`
  } catch { return url + ".json" }
}

function buildCart(url: string, variantId: number, qty: number): string {
  try { return `${new URL(url).origin}/cart/${variantId}:${qty}` } catch { return "" }
}

export async function checkShopify(
  retailerProductId: string, productUrl: string, desiredQty = 1, retries = 2
): Promise<StockCheckResult> {
  const jsonUrl = toJsonUrl(productUrl)
  for (let attempt = 0; attempt <= retries; attempt++) {
    const start = Date.now()
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1200 * attempt))
      const res = await fetch(jsonUrl, {
        headers: {
          "User-Agent":     "Mozilla/5.0 (compatible; CollectibleTracker/3.0; +https://collectibletracker.app)",
          "Accept":         "application/json",
          "Accept-Language":"en-GB,en;q=0.9",
        },
        signal: AbortSignal.timeout(12000),
        cache:  "no-store",
      })
      const ms = Date.now() - start
      if (res.status === 429 && attempt < retries) { await new Promise(r => setTimeout(r, 3000)); continue }
      if (!res.ok) return err(retailerProductId, productUrl, `HTTP ${res.status}`, res.status, ms)

      const data = await res.json() as { product: ShopifyProduct }
      const variants = data?.product?.variants
      if (!variants?.length) return err(retailerProductId, productUrl, "No product data", res.status, ms)

      const available = variants.filter(v => v.available)
      const best = available.length > 0
        ? available.reduce((a, b) => parseFloat(a.price) <= parseFloat(b.price) ? a : b)
        : variants[0]

      let price = parseFloat(best.price)
      if (price > 500 && !best.price.includes(".")) price = price / 100

      return {
        retailerProductId, productUrl, price, currency: "GBP",
        stockStatus:  available.length > 0 ? "in_stock" : "sold_out",
        fastBuyUrl:   available.length > 0 ? buildCart(productUrl, best.id, desiredQty) : null,
        checkedAt:    new Date().toISOString(),
        responseMs:   ms, httpStatus: res.status, error: null,
      }
    } catch (e: unknown) {
      if (attempt === retries) return err(retailerProductId, productUrl, e instanceof Error ? e.message : "Fetch failed", null, Date.now() - start)
    }
  }
  return err(retailerProductId, productUrl, "All retries exhausted", null, 0)
}

function err(id: string, url: string, msg: string, status: number | null, ms: number): StockCheckResult {
  return { retailerProductId:id, productUrl:url, price:null, currency:"GBP",
    stockStatus:"unknown", fastBuyUrl:null, checkedAt:new Date().toISOString(),
    responseMs:ms, httpStatus:status, error:msg }
}
