
import Link from "next/link"
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background:"var(--bg)" }}>
      <div className="text-center">
        <div className="text-6xl mb-4">📦</div>
        <h1 className="text-2xl font-black mb-2" style={{ color:"var(--text)" }}>Page not found</h1>
        <p className="text-sm mb-6" style={{ color:"var(--muted)" }}>This page doesn&apos;t exist or has been moved.</p>
        <Link href="/dashboard" className="btn-primary btn-md inline-flex">Go to Dashboard</Link>
      </div>
    </div>
  )
}
