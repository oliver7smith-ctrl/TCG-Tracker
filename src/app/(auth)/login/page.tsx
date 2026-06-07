
"use client"
import { useState, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function LoginForm() {
  const [mode, setMode]     = useState<"signin"|"signup"|"reset">("signin")
  const [email, setEmail]   = useState("")
  const [password, setPassword] = useState("")
  const [name, setName]     = useState("")
  const [err, setErr]       = useState<string|null>(null)
  const [ok, setOk]         = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dashboard"
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setOk(null); setLoading(true)
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
        })
        if (error) throw error
        setOk("Reset link sent — check your email."); return
      }
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: name || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` },
        })
        if (error) throw error
        setOk("Account created! Check your email to confirm."); return
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push(next); router.refresh()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Something went wrong") }
    finally { setLoading(false) }
  }

  const titles = { signin:"Welcome back", signup:"Create account", reset:"Reset password" }
  const subs   = { signin:"Sign in to your account", signup:"Start tracking for free", reset:"We'll send a reset link" }
  const btns   = { signin:"Sign in", signup:"Create account", reset:"Send reset link" }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background:"var(--bg)" }}>
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 items-center justify-center mb-4 text-2xl">⚡</Link>
          <h1 className="text-2xl font-black" style={{ color:"var(--text)" }}>{titles[mode]}</h1>
          <p className="text-sm mt-1" style={{ color:"var(--muted)" }}>{subs[mode]}</p>
        </div>
        <div className="card p-7">
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:"var(--muted)" }}>Name</label>
                <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:"var(--muted)" }}>Email</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            {mode !== "reset" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color:"var(--muted)" }}>Password</label>
                <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
              </div>
            )}
            {err && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-2 rounded-lg">{err}</p>}
            {ok  && <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg">{ok}</p>}
            <button type="submit" disabled={loading} className="btn-primary btn-md w-full">
              {loading ? "Please wait…" : btns[mode]}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t text-center space-y-2" style={{ borderColor:"var(--border)" }}>
            {mode !== "signin"  && <button onClick={()=>{setMode("signin");setErr(null);setOk(null)}} className="text-sm text-brand-500 font-semibold hover:text-brand-600">Sign in instead</button>}
            {mode !== "signup"  && <div className="text-sm" style={{color:"var(--muted)"}}>New here? <button onClick={()=>{setMode("signup");setErr(null);setOk(null)}} className="text-brand-500 font-semibold">Create account</button></div>}
            {mode === "signin"  && <button onClick={()=>{setMode("reset");setErr(null);setOk(null)}} className="text-xs hover:text-brand-500 transition-colors" style={{ color:"var(--dim)" }}>Forgot password?</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
