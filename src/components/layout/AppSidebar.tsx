
"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types"

const NAV = [
  { href:"/dashboard",      label:"Home",        icon:"🏠" },
  { href:"/explore",        label:"Explore",      icon:"🔍" },
  { href:"/market",         label:"Market",       icon:"📊" },
  { href:"/watchlist",      label:"Watchlist",    icon:"❤️" },
  { href:"/collection",     label:"Collection",   icon:"📦" },
  { href:"/portfolio",      label:"Portfolio",    icon:"💹" },
  { href:"/notifications",  label:"Alerts",       icon:"🔔" },
  { href:"/release-calendar",label:"Releases",   icon:"📅" },
  { href:"/settings",       label:"Settings",     icon:"⚙️" },
]
const ADMIN_NAV = [
  { href:"/admin",              label:"Overview",     icon:"🛡️" },
  { href:"/admin/products",     label:"Products",     icon:"📦" },
  { href:"/admin/retailers",    label:"Retailers",    icon:"🏪" },
  { href:"/admin/users",        label:"Users",        icon:"👥" },
  { href:"/admin/invite-codes", label:"Invite Codes", icon:"🎫" },
]

export function AppSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const initials = (profile?.display_name?.[0] ?? profile?.email?.[0] ?? "U").toUpperCase()

  async function signOut() {
    await supabase.auth.signOut()
    router.push("/auth/login"); router.refresh()
  }

  return (
    <aside className="hidden md:flex w-64 flex-col flex-shrink-0 h-screen border-r" style={{ background:"var(--surface)", borderColor:"var(--border)" }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor:"var(--border)" }}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center flex-shrink-0">⚡</div>
          <div>
            <div className="text-sm font-black leading-tight" style={{ color:"var(--text)" }}>Collectible</div>
            <div className="text-xs font-semibold" style={{ color:"var(--muted)" }}>Tracker</div>
          </div>
        </Link>
        {/* Tier badge */}
        <div className="mt-3">
          <span className={`badge text-[10px] ${profile?.subscription_tier === "premium" ? "tier-premium" : profile?.subscription_tier === "enterprise" ? "tier-enterprise" : "tier-free"}`}>
            {(profile?.subscription_tier ?? "free").toUpperCase()}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={`nav-item ${active ? "active" : ""}`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
        {(profile?.role === "admin" || profile?.role === "super_admin") && (
          <div className="pt-4 mt-2 border-t" style={{ borderColor:"var(--border)" }}>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color:"var(--dim)" }}>Admin</p>
            {ADMIN_NAV.map(item => {
              const active = pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}>
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t" style={{ borderColor:"var(--border)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1" style={{ background:"var(--surface2)" }}>
          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-black text-brand-500 flex-shrink-0">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color:"var(--text)" }}>{profile?.display_name ?? "User"}</div>
            <div className="text-xs truncate" style={{ color:"var(--dim)" }}>{profile?.email}</div>
          </div>
        </div>
        <button onClick={signOut} className="btn-ghost btn-sm w-full justify-start gap-3">
          🚪 Sign out
        </button>
      </div>
    </aside>
  )
}
