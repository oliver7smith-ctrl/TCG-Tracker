
"use client"
import { useState } from "react"
import { usePushNotifications } from "@/hooks/usePushNotifications"
export function PushPrompt() {
  const { supported, subscribed, loading, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(false)
  if (!supported || subscribed || dismissed) return null
  return (
    <div className="card p-5 flex items-start gap-4 slide-down" style={{ borderColor:"rgba(124,58,237,0.3)", background:"rgba(124,58,237,0.04)" }}>
      <div className="text-3xl flex-shrink-0">🔔</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm mb-0.5" style={{ color:"var(--text)" }}>Enable push notifications</h3>
        <p className="text-xs" style={{ color:"var(--muted)" }}>Get an instant notification the moment a tracked item restocks — even with the app closed.</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={subscribe} disabled={loading} className="btn-primary btn-sm">{loading?"…":"Enable"}</button>
        <button onClick={()=>setDismissed(true)} className="btn-ghost btn-sm">Later</button>
      </div>
    </div>
  )
}
