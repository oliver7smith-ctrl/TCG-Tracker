
import type { StockCheckResult } from "@/types"

const IN_STOCK  = [/in[\s-]?stock/i, /add to (?:basket|cart|bag)/i, /buy now/i, /available(?:\s+now)?/i]
const SOLD_OUT  = [/out[\s-]?of[\s-]?stock/i, /sold[\s-]?out/i, /(?:currently\s+)?unavailable/i, /not\s+available/i]
const PREORDER  = [/pre[\s-]?order/i, /pre[\s-]?sale/i, /coming\s+soon/i, /notify\s+me/i]
const BACKORDER = [/back[\s-]?order/i, /ships\s+when\s+available/i]
const PRICE_RE  = [/(?:£|GBP)\s*([\d,]+\.?\d{0,2})/, /"price":\s*"?([\d]+\.[\d]{2})"?/i]

export async function checkHtml(
  retailerProductId: string, productUrl: string, retries = 2
): Promise<StockCheckResult> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const start = Date.now()
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1500 * attempt))
      const res = await fetch(productUrl, {
        headers: {
          "User-Agent":     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Accept":         "text/html,application/xhtml+xml,*/*;q=0.8",
          "Accept-Language":"en-GB,en;q=0.9",
        },
        signal: AbortSignal.timeout(18000),
        redirect: "follow",
      })
      const ms = Date.now() - start
      if (res.status === 403 || res.status === 429) {
        if (attempt < retries) continue
        return err(retailerProductId, productUrl, `Blocked ${res.status}`, res.status, ms)
      }
      if (!res.ok) return err(retailerProductId, productUrl, `HTTP ${res.status}`, res.status, ms)

      const html = await res.text()

      // Price
      let price: number | null = null
      const metas = [
        html.match(/product:price:amount"\s+content="([\d.]+)"/),
        html.match(/itemprop="price"\s+content="([\d.]+)"/),
        html.match(/data-price="([\d.]+)"/),
      ]
      for (const m of metas) if (m?.[1]) { price = parseFloat(m[1]); break }
      if (price === null) {
        for (const p of PRICE_RE) {
          const m = html.match(p)
          if (m) { price = parseFloat(m[1].replace(/,/g,"")); break }
        }
      }
      if (price !== null && (price < 0.01 || price > 50000)) price = null

      // Stock
      const avail = [
        html.match(/product:availability"\s+content="([^"]+)"/),
        html.match(/"availability":\s*"([^"]+)"/),
      ].map(m => m?.[1]?.toLowerCase() ?? "").join(" ")

      let stockStatus: StockCheckResult["stockStatus"] = "unknown"
      if (/instock|in.stock/.test(avail))               stockStatus = "in_stock"
      else if (/oos|outofstock|out.of.stock/.test(avail)) stockStatus = "sold_out"
      else if (/preorder|pre.order/.test(avail))          stockStatus = "preorder"
      else if (/backorder/.test(avail))                   stockStatus = "backorder"
      else {
        const body = html.toLowerCase()
        if      (PREORDER.some(p  => p.test(body)))  stockStatus = "preorder"
        else if (BACKORDER.some(p => p.test(body)))  stockStatus = "backorder"
        else if (SOLD_OUT.some(p  => p.test(body)))  stockStatus = "sold_out"
        else if (IN_STOCK.some(p  => p.test(body)))  stockStatus = "in_stock"
      }

      return { retailerProductId, productUrl, price, currency:"GBP",
        stockStatus, fastBuyUrl:null, checkedAt:new Date().toISOString(),
        responseMs:ms, httpStatus:res.status, error:null }
    } catch (e: unknown) {
      if (attempt === retries) return err(retailerProductId, productUrl, e instanceof Error ? e.message : "Fetch failed", null, Date.now() - start)
    }
  }
  return err(retailerProductId, productUrl, "Retries exhausted", null, 0)
}

function err(id: string, url: string, msg: string, status: number | null, ms: number): StockCheckResult {
  return { retailerProductId:id, productUrl:url, price:null, currency:"GBP",
    stockStatus:"unknown", fastBuyUrl:null, checkedAt:new Date().toISOString(),
    responseMs:ms, httpStatus:status, error:msg }
}
