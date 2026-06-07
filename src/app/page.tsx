
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Collectible Tracker — Your Collector's Operating System",
  description: "Track TCG stock, manage your collection, and invest smarter. The definitive app for Pokémon, One Piece, Lorcana and every collectible.",
}

const features = [
  { icon: "⚡", label: "Stock Tracking",       desc: "Live stock updates across 20+ UK retailers, checked every 2 minutes." },
  { icon: "📦", label: "Collection Manager",   desc: "Track everything you own. Purchase price, condition, grading and value." },
  { icon: "💹", label: "Portfolio Dashboard",  desc: "Real-time P&L, ROI tracking and performance against market." },
  { icon: "🤖", label: "AI Insights",          desc: "Restock predictions, demand scoring and personalised recommendations." },
  { icon: "🔔", label: "Instant Alerts",       desc: "Push, email and SMS the moment something restocks or drops in price." },
  { icon: "📅", label: "Release Calendar",     desc: "Every upcoming release confirmed or rumoured, with pre-order links." },
]

const tiers = [
  {
    name: "Free", price: "£0", period: "/month",
    features: ["10 watchlist items", "Basic stock alerts", "Release calendar", "Product search"],
    cta: "Get started", href: "/auth/signup", highlight: false,
  },
  {
    name: "Premium", price: "£9.99", period: "/month",
    features: ["100 watchlist items", "SMS alerts", "Portfolio tracking", "Price history", "AI insights", "2-min check interval", "Investment tools"],
    cta: "Start free trial", href: "/auth/signup?plan=premium", highlight: true,
  },
  {
    name: "Enterprise", price: "£49.99", period: "/month",
    features: ["Unlimited watchlists", "API access", "Retailer analytics", "Demand reports", "Priority support", "Custom integrations"],
    cta: "Contact us", href: "mailto:enterprise@collectibletracker.app", highlight: false,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(255,255,255,0.85)", borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center">⚡</div>
            <span className="font-black text-sm" style={{ color: "var(--text)" }}>Collectible Tracker</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-secondary btn-sm hidden sm:flex">Sign in</Link>
            <Link href="/auth/signup" className="btn-primary btn-sm">Start free →</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-28 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#7c3aed" }}>
          <span className="pulse-dot w-1.5 h-1.5" />
          New · Portfolio tracking + AI insights now live
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6" style={{ color: "var(--text)" }}>
          Your collector&apos;s<br/>
          <span className="text-brand-500">operating system</span>
        </h1>
        <p className="text-xl leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: "var(--muted)" }}>
          Track stock across 20+ UK retailers. Manage your entire collection. Get AI-powered investment insights. The app serious collectors use every day.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
          <Link href="/auth/signup" className="btn-primary btn-lg">Start for free →</Link>
          <Link href="/auth/signup?plan=premium" className="btn-secondary btn-lg">Try Premium free</Link>
        </div>
        <p className="text-xs" style={{ color: "var(--dim)" }}>Free forever · No credit card · iPhone &amp; Android</p>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.label} className="card p-6 hover:border-brand-500/30 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <div className="font-bold text-base mb-2" style={{ color: "var(--text)" }}>{f.label}</div>
              <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black tracking-tight mb-3" style={{ color: "var(--text)" }}>Simple, honest pricing</h2>
          <p className="text-base" style={{ color: "var(--muted)" }}>Start free. Upgrade when you need more power.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map(t => (
            <div key={t.name} className={`card p-7 flex flex-col ${t.highlight ? "border-brand-500 shadow-glow" : ""}`}
              style={t.highlight ? { borderColor: "#7c3aed" } : {}}>
              {t.highlight && (
                <div className="badge badge-purple text-xs self-start mb-3">Most Popular</div>
              )}
              <div className="font-bold text-lg mb-1" style={{ color: "var(--text)" }}>{t.name}</div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black" style={{ color: "var(--text)" }}>{t.price}</span>
                <span className="text-sm" style={{ color: "var(--muted)" }}>{t.period}</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {t.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text2)" }}>
                    <span className="text-emerald-500">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href={t.href} className={t.highlight ? "btn-primary btn-md text-center" : "btn-secondary btn-md text-center"}>
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black" style={{ color: "var(--text)" }}>⚡ Collectible Tracker</span>
          </div>
          <div className="flex gap-6 text-xs" style={{ color: "var(--dim)" }}>
            <Link href="/auth/login">Sign in</Link>
            <Link href="/auth/signup">Sign up</Link>
            <a href="mailto:hello@collectibletracker.app">Contact</a>
          </div>
          <p className="text-xs" style={{ color: "var(--dim)" }}>Always verify at retailer checkout.</p>
        </div>
      </footer>
    </div>
  )
}
