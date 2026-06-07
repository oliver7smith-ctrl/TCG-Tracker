
"use client"
import { useState } from "react"

export function RedeemCode() {
  const [code, setCode]     = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<{ type: "ok" | "err"; text: string } | null>(null)

  async function redeem() {
    if (!code.trim()) return
    setLoading(true); setResult(null)
    const res  = await fetch("/api/invite/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    })
    const data = await res.json()
    setResult(data.success
      ? { type: "ok",  text: `Code accepted! You now have ${data.tier} access.${data.expires_at ? ` Expires ${new Date(data.expires_at).toLocaleDateString("en-GB")}.` : " Permanent."}` }
      : { type: "err", text: data.error ?? "Invalid code" }
    )
    if (data.success) setCode("")
    setLoading(false)
  }

  return (
    <div className="card p-6 mb-4">
      <h3 className="font-bold text-base mb-0.5" style={{ color: "var(--text)" }}>Redeem Invite Code</h3>
      <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Have a code? Enter it here to unlock premium access.</p>
      <div className="flex gap-3">
        <input
          className="input font-mono uppercase tracking-widest"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX"
          maxLength={14}
        />
        <button onClick={redeem} disabled={loading || !code.trim()} className="btn-primary btn-md flex-shrink-0">
          {loading ? "…" : "Redeem"}
        </button>
      </div>
      {result && (
        <p className={`text-sm mt-3 px-3 py-2 rounded-lg ${result.type === "ok" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : "text-red-500 bg-red-50 dark:bg-red-500/10"}`}>
          {result.text}
        </p>
      )}
    </div>
  )
}
