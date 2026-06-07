
export function formatPrice(p: number | null | undefined, currency = "GBP"): string {
  if (p == null) return "—"
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(p)
}
export function formatPct(p: number | null | undefined): string {
  if (p == null) return "—"
  return `${p > 0 ? "+" : ""}${p.toFixed(1)}%`
}
export function timeAgo(d: string | Date | null | undefined): string {
  if (!d) return "Never"
  const dt = typeof d === "string" ? new Date(d) : d
  const m  = Math.floor((Date.now() - dt.getTime()) / 60000)
  if (m < 1)  return "Just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days/7)}w ago`
  return dt.toLocaleDateString("en-GB", { day:"numeric", month:"short" })
}
export function cn(...cls: (string | undefined | null | false)[]): string {
  return cls.filter(Boolean).join(" ")
}
export function slugify(t: string): string {
  return t.toLowerCase().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")
}
export function formatDate(d: string | null | undefined): string {
  if (!d) return "TBC"
  return new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })
}
export function formatDateShort(d: string | null | undefined): string {
  if (!d) return "TBC"
  return new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short" })
}
