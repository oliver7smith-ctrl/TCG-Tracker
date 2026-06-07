
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
const NAV = [
  { href:"/dashboard",     label:"Home",    icon:"🏠" },
  { href:"/explore",       label:"Explore", icon:"🔍" },
  { href:"/market",        label:"Market",  icon:"📊" },
  { href:"/watchlist",     label:"Watch",   icon:"❤️" },
  { href:"/collection",    label:"Collect", icon:"📦" },
]
export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50 border-t"
      style={{ background:"var(--surface)", borderColor:"var(--border)", paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
      <div className="flex h-16">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
              style={{ color: active ? "var(--primary)" : "var(--dim)" }}>
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[9px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
