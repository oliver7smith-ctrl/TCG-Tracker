
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { MobileNav }  from "@/components/layout/MobileNav"
import { TopBar }     from "@/components/layout/TopBar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  return (
    <div className="flex h-screen overflow-hidden" style={{ background:"var(--bg)" }}>
      <AppSidebar profile={profile} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar profile={profile} />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  )
}
