
"use client"
import { useEffect, useState } from "react"
export function usePushNotifications() {
  const [supported, setSupported]   = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading]       = useState(false)
  useEffect(() => {
    const ok = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
    setSupported(ok)
    if (!ok) return
    navigator.serviceWorker.register("/sw.js").catch(console.error)
    navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription().then(s => setSubscribed(!!s)))
  }, [])
  async function subscribe() {
    if (!supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      const res = await fetch("/api/notifications/subscribe", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(sub.toJSON()),
      })
      if (res.ok) setSubscribed(true)
    } catch (e) { console.error("Push subscribe:", e) }
    finally { setLoading(false) }
  }
  return { supported, subscribed, loading, subscribe }
}
function urlBase64(b64: string): Uint8Array {
  const pad = "=".repeat((4 - b64.length % 4) % 4)
  const raw  = window.atob((b64+pad).replace(/-/g,"+").replace(/_/g,"/"))
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}
