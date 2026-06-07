
// Server-side permission checks — NEVER run these on the client.
// All premium feature checks must go through these functions.

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import type { Profile, TierID } from "@/types"

// Get the full profile including tier (server only)
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  return data
}

// Check if the current user can use a feature
// Founders and admins bypass all tier checks
export function canUseTier(profile: Profile | null, requiredTier: TierID): boolean {
  if (!profile) return false
  if (profile.subscription_tier === "founder") return true
  if (profile.role === "super_admin" || profile.role === "admin") return true

  const TIER_RANK: Record<string, number> = {
    free: 0, premium: 1, enterprise: 2, founder: 99,
  }
  const userRank     = TIER_RANK[profile.subscription_tier] ?? 0
  const requiredRank = TIER_RANK[requiredTier] ?? 0
  return userRank >= requiredRank
}

// Is the user a founder or super_admin?
export function isFounder(profile: Profile | null): boolean {
  if (!profile) return false
  return profile.subscription_tier === "founder" || profile.role === "super_admin"
}

// Is the user any kind of admin?
export function isAdmin(profile: Profile | null): boolean {
  if (!profile) return false
  return profile.role === "admin" || profile.role === "super_admin" || isFounder(profile)
}

// Effective tier — founders always show as enterprise
export function effectiveTier(profile: Profile | null): TierID {
  if (!profile) return "free"
  if (isFounder(profile)) return "enterprise"
  return profile.subscription_tier
}

// Check watchlist limit
export async function checkWatchlistLimit(userId: string): Promise<{
  allowed: boolean; current: number; limit: number
}> {
  const db = createServiceClient()
  const [{ count }, { data: profile }] = await Promise.all([
    db.from("watchlist").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("profiles")
      .select("subscription_tier,role")
      .eq("id", userId)
      .single(),
  ])
  const current = count ?? 0
  if (profile?.role === "super_admin" || profile?.subscription_tier === "founder") {
    return { allowed: true, current, limit: 999999 }
  }
  const { data: tier } = await db
    .from("subscription_tiers")
    .select("max_watchlist_items")
    .eq("id", profile?.subscription_tier ?? "free")
    .single()
  const limit = tier?.max_watchlist_items ?? 10
  return { allowed: current < limit, current, limit }
}
