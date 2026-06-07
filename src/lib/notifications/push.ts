
// Push notifications via web-push
// If VAPID keys are not set, push alerts are silently skipped.

import type { Profile, PushSubscriptionData } from "@/types"

export async function sendPush(
  profile: Profile,
  title: string,
  body: string,
  url: string
): Promise<void> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_SUBJECT) {
    console.log("[Push] Skipped — VAPID keys not configured")
    return
  }
  if (!profile.push_subscription) {
    console.log("[Push] Skipped — no push subscription for user")
    return
  }

  const webpush = (await import("web-push")).default
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )

  const payload = JSON.stringify({
    title, body,
    icon:    "/icons/icon-192.png",
    badge:   "/icons/badge-96.png",
    data:    { url, timestamp: Date.now() },
    actions: [{ action: "open", title: "View" }, { action: "buy", title: "Buy Now" }],
    tag:     "ct-stock",
    renotify:true,
    requireInteraction: true,
  })

  await webpush.sendNotification(
    profile.push_subscription as Parameters<typeof webpush.sendNotification>[0],
    payload,
    { TTL: 3600 }
  )
}
