
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { SettingsView } from "@/components/settings/SettingsView"
import { RedeemCode } from "@/components/settings/RedeemCode"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 fade-in">
      <div className="mb-6">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Manage your account and preferences</p>
      </div>
      {/* Invite code redemption — shown to non-premium users */}
      {profile?.subscription_tier === "free" && <RedeemCode />}
      <SettingsView profile={profile} />
    </div>
  )
}
