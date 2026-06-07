
"use client"
import { useState } from "react"
import type { Profile } from "@/types"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import Link from "next/link"

export function SettingsView({ profile }: { profile: Profile | null }) {
  const [fm, setFm] = useState({
    display_name:             profile?.display_name ?? "",
    phone:                    profile?.phone ?? "",
    email_alerts:             profile?.email_alerts ?? true,
    sms_alerts:               profile?.sms_alerts ?? false,
    push_alerts:              profile?.push_alerts ?? true,
    alert_on_in_stock:        profile?.alert_on_in_stock ?? true,
    alert_on_preorder:        profile?.alert_on_preorder ?? false,
    alert_on_price_drop:      profile?.alert_on_price_drop ?? true,
    min_alert_interval_mins:  profile?.min_alert_interval_mins ?? 30,
    global_max_price:         profile?.global_max_price?.toString() ?? "",
    quiet_hours_enabled:      profile?.quiet_hours_enabled ?? false,
    quiet_start_hour:         profile?.quiet_start_hour ?? 23,
    quiet_end_hour:           profile?.quiet_end_hour ?? 8,
    theme:                    profile?.theme ?? "system",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [err, setErr]       = useState<string|null>(null)
  const { supported, subscribed, subscribe, loading: pushLoading } = usePushNotifications()
  const isPremium = profile?.subscription_tier !== "free"

  const set = (k: string, v: unknown) => setFm(p => ({ ...p, [k]: v }))

  async function save() {
    setSaving(true); setSaved(false); setErr(null)
    try {
      const res = await fetch("/api/profile", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ ...fm, global_max_price: fm.global_max_price ? parseFloat(fm.global_max_price) : null }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed")
      setSaved(true)
      if (fm.theme === "dark") document.documentElement.classList.add("dark")
      else if (fm.theme === "light") document.documentElement.classList.remove("dark")
      else { window.matchMedia("(prefers-color-scheme:dark)").matches ? document.documentElement.classList.add("dark") : document.documentElement.classList.remove("dark") }
      localStorage.setItem("ct_theme", fm.theme)
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Failed") }
    finally { setSaving(false); setTimeout(() => setSaved(false), 3000) }
  }

  const Section = ({ title, desc, children }: { title:string; desc?:string; children:React.ReactNode }) => (
    <div className="card p-6 mb-4">
      <h3 className="font-bold text-base mb-0.5" style={{ color:"var(--text)" }}>{title}</h3>
      {desc && <p className="text-xs mb-4" style={{ color:"var(--muted)" }}>{desc}</p>}
      {!desc && <div className="mb-4" />}
      {children}
    </div>
  )

  const Toggle = ({ label, sub, checked, onChange, requiresPremium }: { label:string; sub?:string; checked:boolean; onChange:(v:boolean)=>void; requiresPremium?:boolean }) => (
    <div className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor:"var(--border)" }}>
      <div>
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color:"var(--text)" }}>
          {label}
          {requiresPremium && !isPremium && <span className="badge tier-premium text-xs">Premium</span>}
        </div>
        {sub && <div className="text-xs" style={{ color:"var(--dim)" }}>{sub}</div>}
      </div>
      <button type="button" onClick={() => { if (requiresPremium && !isPremium) return; onChange(!checked) }}
        className="relative inline-flex w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: checked ? "var(--primary)" : "var(--border)", opacity: requiresPremium && !isPremium ? 0.5 : 1 }}>
        <span className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ transform:`translateX(${checked?"22px":"4px"})` }} />
      </button>
    </div>
  )

  return (
    <div className="space-y-0">
      {/* Subscription */}
      <Section title="Subscription" desc="Your current plan and billing">
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background:"var(--surface2)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`badge ${profile?.subscription_tier==="premium"?"tier-premium":profile?.subscription_tier==="enterprise"?"tier-enterprise":"tier-free"}`}>
                {(profile?.subscription_tier ?? "free").toUpperCase()}
              </span>
              {profile?.subscription_tier === "free" && <span className="text-xs" style={{ color:"var(--muted)" }}>10 watchlist items</span>}
            </div>
          </div>
          {profile?.subscription_tier === "free" && (
            <Link href="/settings?tab=billing" className="btn-primary btn-sm">Upgrade to Premium</Link>
          )}
        </div>
      </Section>

      {/* Profile */}
      <Section title="Profile">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:"var(--muted)" }}>Display Name</label>
            <input className="input" value={fm.display_name} onChange={e=>set("display_name",e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:"var(--muted)" }}>Phone (for SMS)</label>
            <input className="input" type="tel" value={fm.phone} onChange={e=>set("phone",e.target.value)} placeholder="+447700900000" />
            <p className="text-xs mt-1" style={{ color:"var(--dim)" }}>E.164 format: +447700900000</p>
          </div>
        </div>
      </Section>

      {/* Channels */}
      <Section title="Notification Channels" desc="How should we alert you when something restocks?">
        {supported && !subscribed && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.2)" }}>
            <div className="font-semibold mb-1" style={{ color:"var(--primary)" }}>Browser push not enabled</div>
            <button onClick={subscribe} disabled={pushLoading} className="btn-primary btn-sm">{pushLoading?"Enabling…":"Enable push notifications"}</button>
          </div>
        )}
        <Toggle label="Push notifications" sub="Instant alerts in browser or phone" checked={fm.push_alerts} onChange={v=>set("push_alerts",v)} />
        <Toggle label="Email alerts" sub={`Sent to ${profile?.email ?? "your email"}`} checked={fm.email_alerts} onChange={v=>set("email_alerts",v)} />
        <Toggle label="SMS alerts" sub={fm.phone ? `Sent to ${fm.phone}` : "Add a phone number above"} checked={fm.sms_alerts} onChange={v=>set("sms_alerts",v)} requiresPremium />
      </Section>

      {/* Conditions */}
      <Section title="Alert Conditions">
        <Toggle label="Item comes back in stock" checked={fm.alert_on_in_stock}   onChange={v=>set("alert_on_in_stock",v)} />
        <Toggle label="Pre-order opens"          checked={fm.alert_on_preorder}   onChange={v=>set("alert_on_preorder",v)} />
        <Toggle label="Price drops"              checked={fm.alert_on_price_drop} onChange={v=>set("alert_on_price_drop",v)} />
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:"var(--muted)" }}>Min time between alerts (mins)</label>
            <input className="input" type="number" min="5" max="1440" value={fm.min_alert_interval_mins} onChange={e=>set("min_alert_interval_mins",parseInt(e.target.value)||30)} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:"var(--muted)" }}>Global max price (£)</label>
            <input className="input" type="number" min="0" step="0.01" value={fm.global_max_price} onChange={e=>set("global_max_price",e.target.value)} placeholder="No limit" />
          </div>
        </div>
      </Section>

      {/* Quiet hours */}
      <Section title="Quiet Hours" desc="Pause alerts overnight">
        <Toggle label="Enable quiet hours" checked={fm.quiet_hours_enabled} onChange={v=>set("quiet_hours_enabled",v)} />
        {fm.quiet_hours_enabled && (
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:"var(--muted)" }}>From (UTC hour)</label>
              <input className="input" type="number" min="0" max="23" value={fm.quiet_start_hour} onChange={e=>set("quiet_start_hour",parseInt(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:"var(--muted)" }}>Until (UTC hour)</label>
              <input className="input" type="number" min="0" max="23" value={fm.quiet_end_hour} onChange={e=>set("quiet_end_hour",parseInt(e.target.value))} />
            </div>
          </div>
        )}
      </Section>

      {/* Theme */}
      <Section title="Appearance">
        <div className="flex gap-3">
          {(["light","dark","system"] as const).map(t => (
            <button key={t} onClick={()=>set("theme",t)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all`}
              style={{
                borderColor: fm.theme===t ? "var(--primary)" : "var(--border)",
                background:  fm.theme===t ? "rgba(124,58,237,0.1)" : "var(--surface2)",
                color:       fm.theme===t ? "var(--primary)" : "var(--muted)",
              }}>
              {t==="light"?"☀️ Light":t==="dark"?"🌙 Dark":"💻 System"}
            </button>
          ))}
        </div>
      </Section>

      {err   && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-4 py-3 rounded-xl">{err}</p>}
      {saved && <p className="text-sm px-4 py-3 rounded-xl" style={{ background:"var(--green-s)", color:"var(--green)" }}>✓ Preferences saved</p>}
      <button onClick={save} disabled={saving} className="btn-primary btn-lg w-full">
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </div>
  )
}
