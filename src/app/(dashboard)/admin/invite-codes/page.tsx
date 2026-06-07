
"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

interface Code {
  id: string; code: string; label: string | null; grants_tier: string
  grants_duration_days: number | null; max_uses: number; use_count: number
  is_active: boolean; expires_at: string | null; created_at: string
}

export default function InviteCodesPage() {
  const [codes, setCodes]       = useState<Code[]>([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm]         = useState({
    label: "", grants_tier: "premium", duration_days: "", max_uses: "1", expires_at: "",
  })
  const [newCode, setNewCode]   = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res  = await fetch("/api/admin/invite-codes")
    const data = await res.json()
    setCodes(data); setLoading(false)
  }

  async function create() {
    setCreating(true); setNewCode(null)
    const res  = await fetch("/api/admin/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label:         form.label || null,
        grants_tier:   form.grants_tier,
        duration_days: form.duration_days ? parseInt(form.duration_days) : null,
        max_uses:      parseInt(form.max_uses) || 1,
        expires_at:    form.expires_at || null,
      }),
    })
    const data = await res.json()
    if (data.code) { setNewCode(data.code); load() }
    setCreating(false)
  }

  async function deactivate(id: string) {
    await fetch("/api/admin/invite-codes", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    })
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="btn-ghost btn-sm">← Back</Link>
        <div>
          <h1 className="page-title">Invite Codes</h1>
          <p className="page-sub">Grant premium access to testers</p>
        </div>
      </div>

      {/* Create form */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-base mb-4" style={{ color: "var(--text)" }}>Create new code</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>Label (optional)</label>
            <input className="input" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Beta tester" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>Grants tier</label>
            <select className="input" value={form.grants_tier} onChange={e => setForm(f => ({ ...f, grants_tier: e.target.value }))}>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
              <option value="founder">Founder (all access)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>Duration (days, blank = permanent)</label>
            <input className="input" type="number" min="1" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} placeholder="Permanent" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted)" }}>Max uses (0 = unlimited)</label>
            <input className="input" type="number" min="0" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} />
          </div>
        </div>
        <button onClick={create} disabled={creating} className="btn-primary btn-md">
          {creating ? "Creating…" : "Generate code"}
        </button>

        {newCode && (
          <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div className="text-xs font-semibold mb-1" style={{ color: "var(--green)" }}>New code created</div>
            <div className="text-2xl font-black tracking-widest font-mono" style={{ color: "var(--text)" }}>{newCode}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Share this with your tester. They can redeem it in Settings.</div>
          </div>
        )}
      </div>

      {/* Existing codes */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>Loading…</div>
        ) : !codes.length ? (
          <div className="p-8 text-center text-sm" style={{ color: "var(--muted)" }}>No codes yet</div>
        ) : (
          codes.map((c, i) => (
            <div key={c.id} className={`flex items-center gap-4 px-5 py-4 ${i < codes.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
              <div className="flex-1 min-w-0">
                <div className="font-mono font-bold tracking-widest text-sm" style={{ color: "var(--text)" }}>{c.code}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {c.label && <span className="mr-2">{c.label}</span>}
                  {c.grants_tier} · {c.use_count}/{c.max_uses === 0 ? "∞" : c.max_uses} uses
                  {c.grants_duration_days && ` · ${c.grants_duration_days}d`}
                  {c.expires_at && ` · expires ${new Date(c.expires_at).toLocaleDateString("en-GB")}`}
                </div>
              </div>
              <span className={`badge text-xs ${c.is_active ? "badge-green" : "badge-gray"}`}>
                {c.is_active ? "Active" : "Used"}
              </span>
              {c.is_active && (
                <button onClick={() => deactivate(c.id)} className="btn-danger btn-xs">Deactivate</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
