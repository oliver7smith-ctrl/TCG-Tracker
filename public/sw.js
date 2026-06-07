
const CACHE = "ct-v3"
const SHELL = ["/", "/manifest.json"]
self.addEventListener("install",  e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(()=>{})).then(()=>self.skipWaiting())) })
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>clients.claim())) })
self.addEventListener("fetch", e => {
  if (e.request.method!=="GET" || e.request.url.includes("/api/")) return
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && res.type==="basic") caches.open(CACHE).then(c => c.put(e.request, res.clone())).catch(()=>{})
    return res
  })).catch(()=>caches.match("/")))
})
self.addEventListener("push", e => {
  if (!e.data) return
  let d = {}; try { d = e.data.json() } catch { return }
  e.waitUntil(self.registration.showNotification(d.title??"Collectible Tracker", {
    body:d.body, icon:"/icons/icon-192.png", badge:"/icons/badge-96.png",
    data:d.data??{}, actions:d.actions??[],
    tag:"ct-alert", renotify:true, requireInteraction:true,
  }))
})
self.addEventListener("notificationclick", e => {
  e.notification.close()
  const url = e.action==="buy" ? (e.notification.data?.buyUrl ?? e.notification.data?.url ?? "/dashboard") : (e.notification.data?.url ?? "/dashboard")
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list => {
    for (const c of list) if (c.url.includes(location.origin)) { c.focus(); return }
    clients.openWindow(url)
  }))
})
