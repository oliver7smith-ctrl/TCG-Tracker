
// Email alerts via Resend
// If RESEND_API_KEY is not set, email alerts are silently skipped.

import type { StockEvent, Product, Retailer } from "@/types"

export async function sendEmail(
  to: string,
  title: string,
  _body: string,
  event: StockEvent & { product: Product; retailer: Retailer },
  buyUrl: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Email] Skipped — RESEND_API_KEY not configured")
    return
  }

  // Lazy import so build succeeds even if resend is not configured
  const { Resend } = await import("resend")
  const resend = new Resend(process.env.RESEND_API_KEY)
  const APP    = process.env.NEXT_PUBLIC_APP_URL ?? ""

  const price    = event.new_price ? `£${event.new_price.toFixed(2)}` : "TBC"
  const oldPrice = event.previous_price ? `£${event.previous_price.toFixed(2)}` : null

  const html = `<!DOCTYPE html><html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#7c3aed,#5b21b6);padding:28px 32px;">
    <div style="color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">${process.env.NEXT_PUBLIC_APP_NAME ?? "Collectible Tracker"}</div>
    <div style="color:#fff;font-size:22px;font-weight:800;line-height:1.25;">${title}</div>
  </div>
  <div style="padding:28px 32px;border-bottom:1px solid #f1f5f9;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Product</td>
          <td style="padding:8px 0;font-size:13px;color:#0f172a;font-weight:700;text-align:right;">${event.product.name}</td></tr>
      <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Retailer</td>
          <td style="padding:8px 0;font-size:13px;color:#0f172a;font-weight:700;text-align:right;">${event.retailer.name}</td></tr>
      <tr><td style="padding:8px 0;font-size:13px;color:#64748b;">Price</td>
          <td style="padding:8px 0;text-align:right;">
            <span style="font-size:24px;font-weight:800;color:#059669;">${price}</span>
            ${oldPrice ? `<span style="font-size:13px;color:#94a3b8;text-decoration:line-through;margin-left:8px;">${oldPrice}</span>` : ""}
          </td></tr>
    </table>
  </div>
  <div style="padding:24px 32px;">
    <a href="${buyUrl}" style="display:block;background:#059669;color:#fff;text-decoration:none;text-align:center;padding:15px;border-radius:12px;font-weight:700;font-size:16px;margin-bottom:12px;">Buy Now</a>
    <a href="${event.product_url}" style="display:block;background:#f8fafc;color:#475569;text-decoration:none;text-align:center;padding:13px;border-radius:12px;font-size:13px;border:1px solid #e2e8f0;">View Product Page</a>
  </div>
  <div style="padding:16px 32px;background:#f8fafc;text-align:center;font-size:11px;color:#94a3b8;">
    <a href="${APP}/settings" style="color:#7c3aed;text-decoration:none;">Manage alerts</a>
  </div>
</div></body></html>`

  await resend.emails.send({
    from:    `${process.env.RESEND_FROM_NAME ?? "Collectible Tracker"} <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`,
    to,
    subject: title,
    html,
    text: `${title}\n\nBuy now: ${buyUrl}`,
  })
}
