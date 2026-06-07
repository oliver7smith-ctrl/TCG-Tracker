
import Link from "next/link"
export function UpgradeBanner() {
  return (
    <div className="card p-5 flex items-center gap-4 slide-down" style={{ borderColor:"rgba(245,158,11,0.3)", background:"rgba(245,158,11,0.04)" }}>
      <div className="text-3xl flex-shrink-0">⚡</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm" style={{ color:"var(--text)" }}>There&apos;s a lot happening today</h3>
        <p className="text-xs mt-0.5" style={{ color:"var(--muted)" }}>Upgrade to Premium for SMS alerts, portfolio tracking, AI insights and faster checks.</p>
      </div>
      <Link href="/settings?tab=billing" className="btn-warning btn-sm flex-shrink-0">Upgrade →</Link>
    </div>
  )
}
