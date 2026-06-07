
"use client"
import { useState } from "react"
import { timeAgo } from "@/lib/utils/format"

interface User {
  id: string; email: string; display_name: string | null
  role: string; subscription_tier: string; subscription_status: string
  subscription_ends_at: string | null; created_at: string
  watchlist_count: number; collection_count: number; last_active_at: string | null
}

export function AdminUsersView({ users }: { users: User[] }) {
  const [grantEmail, setGrantEmail] = useState("")
  const [grantTier, setGrantTier]   = useState("premium")
  const [grantDays, setGrantDays]   = useState("")
  const [granting, setGranting]     = useState(false)
  const [msg, setMsg]               = useState<{ type: "ok" | "err"; text: string } | null>(null)

  async function grant() {
    setGranting(true); setMsg(null)
    const res  = await fetch("/api/admin/grant-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: grantEmail, tier: grantTier, days: grantDays ? parseInt(grantDays) : null }),
    })
    const data = await res.json()
    setMsg(data.success ? { type: "ok", text: `Granted ${grantTier} to ${grantEmail}` } : { type: "err", text: data.error })
    setGranting(false)
  }

  const tierColor: Record<string, string> = {
    founder: "badge-yellow", enterprise: "badge-purple", premium: "badge-blue",
    free: "badge-gray",
  }

  return (
    <div className="space-y-6">
      {/* Grant access panel */}
      <div className="card p-6">
        <h3 className="font-bold text-base mb-4" style={{ color: "var(--text)" }}>Grant access</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input className="input" placeholder="user@email.com" value={grantEmail} onChange={e => setGrantEmail(e.target.value)} />
          <select className="input" value={grantTier} onChange={e => setGrantTier(e.target.value)}>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
            <option value="founder">Founder</option>
            <option value="free">Free (revoke)</option>
          </select>
          <input className="input" type="number" placeholder="Days (blank = permanent)" value={grantDays} onChange={e => setGrantDays(e.target.value)} />
        </div>
        <button onClick={grant} disabled={granting || !grantEmail} className="btn-primary btn-sm">
          {granting ? "Granting…" : "Grant access"}
        </button>
        {msg && (
          <p className={`text-sm mt-3 px-3 py-2 rounded-lg ${msg.type === "ok" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : "text-red-500 bg-red-50 dark:bg-red-500/10"}`}>
            {msg.text}
          </p>
        )}
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {["User", "Tier", "Role", "Watchlist", "Joined", "Last active"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: "var(--dim)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {users.map(u => (
                <tr key={u.id} className="hover:opacity-80 transition-opacity">
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{u.display_name ?? "—"}</div>
                    <div className="text-xs" style={{ color: "var(--dim)" }}>{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${tierColor[u.subscription_tier] ?? "badge-gray"}`}>
                      {u.subscription_tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{u.role}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--text)" }}>{u.watchlist_count}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--dim)" }}>{timeAgo(u.created_at)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--dim)" }}>{timeAgo(u.last_active_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
