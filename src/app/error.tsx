
"use client"
import { useEffect } from "react"
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background:"var(--bg)" }}>
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-black mb-2" style={{ color:"var(--text)" }}>Something went wrong</h2>
        <p className="text-sm mb-6" style={{ color:"var(--muted)" }}>{error.message}</p>
        <button onClick={reset} className="btn-primary btn-md inline-flex">Try again</button>
      </div>
    </div>
  )
}
