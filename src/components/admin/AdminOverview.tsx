
"use client"
import { useState } from "react"
import type { Retailer } from "@/types"
import { timeAgo } from "@/lib/utils/format"
import Link from "next/link"

interface Props {
  userCount: number; productCount: number; retailerProductCount: number
  events24h: number; retailers: Retailer[]
}

export function AdminOverview({ userCount, productCount, retailerProductCount, events24h, retailers }: Props) {
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<string | null>(null)

  async function manualCheck() {
    setChecking(true); setCheckResult(null)
    try {
      const res  = await fetch("/api/admin/check-stock", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "high" }),
      })
      const data = await res.json()
      setCheckResult(data.ok
        ? `Checked ${data.checked ?? 0} products, found ${data.events ?? 0} events`
        : `Error: ${data.error}`)
    } catch {
      setCheckResult("Network error — check console")
    } finally { setChecking(false) }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Users",          value: userCount,            icon: "👥", color: "var(--primary)" },
          { label: "Products",       value: productCount,         icon: "📦", color: "var(--green)"   },
          { label: "Retailer Links", value: retailerProductCount, icon: "🔗", color: "var(--blue)"    },
          { label: "Events (24h)",   value: events24h,            icon: "⚡", color: "var(--yellow)"  },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Manual stock check */}
      <div className="card p-6">
        <h3 className="font-bold text-base mb-1" style={{ color: "var(--text)" }}>Manual Stock Check</h3>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Run a stock check right now without waiting for the cron job. Use this to test that your retailer URLs are working.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={manualCheck} disabled={checking} className="btn-primary btn-md">
            {checking ? "Checking…" : "⚡ Run stock check now"}
          </button>
          {checkResult && (
            <span className="text-sm" style={{ color: checkResult.startsWith("Error") ? "var(--red)" : "var(--green)" }}>
              {checkResult}
            </span>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: "/admin/products",     icon: "📦", title: "Products",     desc: "Add and manage products" },
          { href: "/admin/retailers",    icon: "🏪", title: "Retailers",    desc: "Manage retailer URLs" },
          { href: "/admin/users",        icon: "👥", title: "Users",        desc: "View users, grant access" },
          { href: "/admin/invite-codes", icon: "🎫", title: "Invite Codes", desc: "Create invite codes for testers" },
        ].map(l => (
          <Link key={l.href} href={l.href} className="card p-5 hover:border-brand-500/30 transition-colors">
            <div className="text-2xl mb-2">{l.icon}</div>
            <div className="font-bold" style={{ color: "var(--text)" }}>{l.title}</div>
            <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>{l.desc}</div>
          </Link>
        ))}
      </div>

      {/* Retailer health */}
      <div>
        <h2 className="section-title">Retailer Health</h2>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Retailer", "Adapter", "Reliability", "Avg Response", "Last Check", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "var(--dim)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {retailers.map(r => {
                  const rc = r.reliability_score >= 80 ? "#10b981" : r.reliability_score >= 60 ? "#f59e0b" : "#ef4444"
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--text)" }}>{r.name}</td>
                      <td className="px-4 py-3"><span className="badge badge-purple text-xs">{r.adapter_type.toUpperCase()}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                            <div className="h-full rounded-full" style={{ width: `${r.reliability_score}%`, background: rc }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: rc }}>{r.reliability_score}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{r.avg_response_ms ? `${r.avg_response_ms}ms` : "—"}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--dim)" }}>{timeAgo(r.last_check_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${r.is_active ? "badge-green" : "badge-red"}`}>
                          {r.is_active ? "Active" : "Off"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
