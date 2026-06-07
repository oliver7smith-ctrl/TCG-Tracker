
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Profile } from "@/types"

const TITLES: Record<string, string> = {
  "/dashboard":"/dashboard","/explore":"Explore","/market":"Market",
  "/watchlist":"Watchlist","/collection":"Collection","/portfolio":"Portfolio",
  "/notifications":"Alerts","/settings":"Settings","/release-calendar":"Releases",
  "/admin":"Admin",
}

export function TopBar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const title = Object.entries(TITLES).sort((a,b)=>b[0].length-a[0].length).find(([k])=>pathname.startsWith(k))?.[1] ?? "Collectible Tracker"
  const pLabel = { "/dashboard":"🏠 Home" }[title] || title
  return (
    <header className="md:hidden flex items-center justify-between px-4 h-14 border-b flex-shrink-0"
      style={{ background:"var(--surface)", borderColor:"var(--border)" }}>
      <span className="font-black text-sm" style={{ color:"var(--text)" }}>⚡ {pLabel}</span>
      <div className="flex items-center gap-2">
        {profile?.subscription_tier === "free" && (
          <Link href="/settings?tab=billing" className="btn-primary btn-xs">Upgrade</Link>
        )}
        <Link href="/notifications" className="w-9 h-9 flex items-center justify-center rounded-xl text-lg" style={{ background:"var(--surface2)" }}>🔔</Link>
      </div>
    </header>
  )
}
