
"use client"
import { useState } from "react"
import type { Notification } from "@/types"
import { timeAgo, formatPrice } from "@/lib/utils/format"

const CH_ICONS: Record<string,string> = { push:"📲", email:"📧", sms:"💬", in_app:"🔔" }
const ST_CFG: Record<string,{ label:string; color:string }> = {
  sent:    { label:"Delivered",  color:"var(--green)"  },
  pending: { label:"Pending",    color:"var(--yellow)" },
  failed:  { label:"Failed",     color:"var(--red)"    },
  skipped: { label:"Skipped",    color:"var(--dim)"    },
}

export function NotificationsView({ notifications }: { notifications: Notification[] }) {
  const [filter, setFilter] = useState("all")
  const filtered = notifications.filter(n =>
    filter==="failed" ? n.status==="failed" :
    filter!=="all"    ? n.channel===filter : true
  )
  if (!notifications.length) {
    return (
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">🔔</div>
        <h3 className="font-bold text-lg mb-2" style={{ color:"var(--text)" }}>No alerts yet</h3>
        <p className="text-sm" style={{ color:"var(--muted)" }}>When tracked products restock or drop in price, your alerts will appear here.</p>
      </div>
    )
  }
  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all","push","email","sms","failed"].map(f => (
          <button key={f} onClick={()=>setFilter(f)} className={`btn-sm ${filter===f?"btn-primary":"btn-secondary"}`}>
            {f==="all"?`All (${notifications.length})`:f==="push"?"📲 Push":f==="email"?"📧 Email":f==="sms"?"💬 SMS":"⚠️ Failed"}
          </button>
        ))}
      </div>
      <div className="card overflow-hidden">
        {!filtered.length ? (
          <div className="p-8 text-center text-sm" style={{ color:"var(--muted)" }}>No {filter} notifications</div>
        ) : filtered.map((n,i) => {
          const st  = ST_CFG[n.status] ?? { label:n.status, color:"var(--muted)" }
          const url = n.fast_buy_url || n.product_url
          const prod = n.product as { name?:string } | undefined
          return (
            <div key={n.id} className={`flex items-start gap-4 px-4 py-4 ${i<filtered.length-1?"border-b":""}`}
              style={{ borderColor:"var(--border)" }}>
              <div className="text-2xl flex-shrink-0">{CH_ICONS[n.channel]??"🔔"}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color:"var(--text)" }}>{n.title ?? "Stock Alert"}</div>
                <div className="text-xs mt-0.5 truncate" style={{ color:"var(--muted)" }}>{n.body ?? prod?.name ?? ""}</div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color:st.color }}>{st.label}</span>
                  {n.price!=null && <span className="text-xs font-bold" style={{ color:"var(--text)" }}>{formatPrice(n.price)}</span>}
                  <span className="text-xs" style={{ color:"var(--dim)" }}>{timeAgo(n.created_at)}</span>
                </div>
              </div>
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary btn-xs flex-shrink-0 self-center">
                  {n.fast_buy_url ? "Buy" : "View"}
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
