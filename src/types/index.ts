
// ── Subscription ──────────────────────────────────────────────────────
export type TierID = "free" | "premium" | "enterprise" | "founder"

export interface SubscriptionTier {
  id: TierID
  name: string
  price_gbp: number
  max_watchlist_items: number
  max_collection_items: number
  check_interval_high_sec: number
  sms_alerts: boolean
  portfolio_tracking: boolean
  historical_pricing: boolean
  investment_tools: boolean
  ai_insights: boolean
  priority_alerts: boolean
  api_access: boolean
  features: string[]
}

// ── Shared ────────────────────────────────────────────────────────────
export type UserRole = "user" | "admin" | "super_admin" | "moderator"
export type StockStatus = "in_stock" | "sold_out" | "preorder" | "backorder" | "unavailable" | "unknown"
export type AlertChannel = "push" | "email" | "sms" | "in_app"
export type NotifStatus = "pending" | "sent" | "failed" | "skipped"
export type Priority = "high" | "medium" | "low"
export type EventType = "in_stock" | "sold_out" | "preorder" | "backorder" | "price_drop" | "price_rise" | "unavailable" | "error"
export type CheckTier = "high" | "medium" | "low" | "paused"
export type InvestmentRating = "strong_buy" | "buy" | "hold" | "sell" | "avoid"
export type RiskRating = "very_low" | "low" | "medium" | "high" | "very_high"
export type Condition = "sealed" | "mint" | "near_mint" | "excellent" | "good" | "played" | "poor"

// ── Database types ─────────────────────────────────────────────────────
export interface Category {
  id: string; name: string; slug: string; description: string | null
  icon_emoji: string | null; color: string; sort_order: number; is_active: boolean
}

export interface Profile {
  id: string; email: string; display_name: string | null; phone: string | null
  avatar_url: string | null; role: UserRole
  subscription_tier: TierID; subscription_status: string
  subscription_ends_at: string | null; stripe_customer_id: string | null
  theme: "light" | "dark" | "system"; timezone: string; currency: string
  email_alerts: boolean; sms_alerts: boolean; push_alerts: boolean
  alert_on_in_stock: boolean; alert_on_preorder: boolean; alert_on_price_drop: boolean
  min_alert_interval_mins: number; global_max_price: number | null
  quiet_hours_enabled: boolean; quiet_start_hour: number; quiet_end_hour: number
  push_subscription: PushSubscriptionData | null
  onboarding_completed: boolean; favourite_categories: string[]
  watchlist_count: number; collection_count: number
  created_at: string; updated_at: string
}

export interface Retailer {
  id: string; name: string; slug: string; base_url: string; domain: string
  logo_url: string | null; description: string | null; affiliate_tag: string | null
  adapter_type: "shopify" | "html" | "api" | "woocommerce"; is_shopify: boolean
  is_active: boolean; is_featured: boolean; reliability_score: number
  avg_response_ms: number | null; success_rate_7d: number | null
  total_checks: number; failed_checks: number
  last_check_at: string | null; last_success_at: string | null
  check_interval_secs: number; rate_limit_per_min: number
  search_url_template: string | null; currency: string; sort_order: number
  created_at: string; updated_at: string
}

export interface Product {
  id: string; category_id: string; name: string; slug: string; aliases: string[]
  set_name: string | null; set_code: string | null; product_type: string; series: string | null
  description: string | null; image_url: string | null; thumbnail_url: string | null
  barcode: string | null; release_date: string | null; rrp_gbp: number | null
  is_active: boolean; is_featured: boolean; is_prerelease: boolean
  demand_score: number; scarcity_score: number; hype_score: number
  view_count: number; watchlist_count: number
  investment_rating: InvestmentRating | null; risk_rating: RiskRating | null
  metadata: Record<string, unknown>; created_at: string; updated_at: string
}

export interface ProductWithAvailability extends Product {
  category_name: string; category_slug: string; category_color: string; category_icon: string
  in_stock_count: number; retailer_count: number
  best_price: number | null; last_in_stock_at: string | null
  rank?: number
}

export interface RetailerProduct {
  id: string; product_id: string; retailer_id: string
  product_url: string; fast_buy_url: string | null
  variant_id: string | null; sku: string | null; is_active: boolean
  current_price: number | null; previous_price: number | null
  current_stock_status: StockStatus; previous_stock_status: StockStatus | null
  last_checked_at: string | null; last_in_stock_at: string | null; last_price_change_at: string | null
  error_count: number; consecutive_errors: number; last_error: string | null; last_error_at: string | null
  check_tier: CheckTier; affiliate_url: string | null
  created_at: string; updated_at: string
  retailer?: Retailer; product?: Product
}

export interface WatchlistItem {
  id: string; user_id: string; product_id: string
  max_price: number | null; desired_quantity: number; priority: Priority
  alerts_enabled: boolean; alert_on_in_stock: boolean
  alert_on_preorder: boolean; alert_on_price_drop: boolean
  watch_all_retailers: boolean; specific_retailer_ids: string[] | null
  notes: string | null; created_at: string; updated_at: string
}

export interface WatchlistWithStatus extends WatchlistItem {
  product_name: string; set_name: string | null; product_type: string; series: string | null
  image_url: string | null; thumbnail_url: string | null; rrp_gbp: number | null
  demand_score: number; investment_rating: InvestmentRating | null
  category_name: string; category_slug: string; category_color: string; category_icon: string
  in_stock_count: number; retailer_count: number
  best_price: number | null; last_in_stock_at: string | null
}

export interface CollectionItem {
  id: string; user_id: string; product_id: string
  quantity_owned: number; quantity_sealed: number; quantity_opened: number
  condition: Condition | null; purchase_price_total: number | null; purchase_price_each: number | null
  purchase_date: string | null; purchase_retailer: string | null; purchase_notes: string | null
  current_value_each: number | null; current_value_total: number | null; last_valued_at: string | null
  grade: string | null; grading_company: string | null; cert_number: string | null
  is_for_sale: boolean; asking_price: number | null; notes: string | null
  tags: string[]; images: string[]; added_from: string | null
  created_at: string; updated_at: string
  product?: ProductWithAvailability
}

export interface PortfolioRow {
  user_id: string; product_id: string; product_name: string; set_name: string | null
  product_type: string; image_url: string | null; category_name: string; category_color: string
  quantity_owned: number; quantity_sealed: number; quantity_opened: number
  condition: string | null; purchase_price_total: number | null; purchase_price_each: number | null
  purchase_date: string | null; current_value_each: number | null; current_value_total: number | null
  grade: string | null; grading_company: string | null
  unrealised_pnl: number | null; roi_pct: number | null
  created_at: string; updated_at: string
}

export interface StockEvent {
  id: string; retailer_product_id: string; product_id: string; retailer_id: string
  event_type: EventType; previous_status: StockStatus | null; new_status: StockStatus | null
  previous_price: number | null; new_price: number | null
  price_change_gbp: number | null; price_change_pct: number | null
  fast_buy_url: string | null; product_url: string; created_at: string
  product?: ProductWithAvailability; retailer?: Retailer
}

export interface Notification {
  id: string; user_id: string; stock_event_id: string | null
  product_id: string | null; retailer_id: string | null
  channel: AlertChannel; status: NotifStatus
  title: string | null; body: string | null; product_url: string | null
  fast_buy_url: string | null; price: number | null
  error_message: string | null; retry_count: number
  sent_at: string | null; read_at: string | null; clicked_at: string | null
  created_at: string
  product?: Product; retailer?: Retailer
}

export interface MarketSummary {
  id: string; date: string
  top_gainers: MarketMover[]
  top_losers: MarketMover[]
  most_restocked: RestockEntry[]
  most_watched: WatchedEntry[]
  new_in_stock: unknown[]
  total_restock_events: number; total_price_drops: number; total_price_rises: number
  avg_price_change_pct: number | null
  ai_summary: string | null; ai_highlights: string[]
  generated_at: string
}

export interface MarketMover {
  product_id: string; name: string; slug: string
  change_pct: number; new_price: number; previous_price: number
}
export interface RestockEntry {
  product_id: string; name: string; slug: string; restock_count: number
}
export interface WatchedEntry {
  product_id: string; name: string; slug: string; watchlist_count: number; demand_score: number
}

export interface ReleaseCalendarEntry {
  id: string; product_id: string | null; category_id: string | null
  name: string; set_name: string | null; product_type: string | null
  release_date: string; image_url: string | null; description: string | null
  rrp_gbp: number | null; is_confirmed: boolean; preorder_url: string | null
  hype_score: number; created_at: string
}

export interface StockCheckResult {
  retailerProductId: string; productUrl: string
  price: number | null; currency: "GBP"
  stockStatus: StockStatus; fastBuyUrl: string | null
  checkedAt: string; responseMs: number; httpStatus: number | null
  error: string | null
}

export interface PushSubscriptionData {
  endpoint: string; expirationTime: number | null
  keys: { p256dh: string; auth: string }
}

// ── Portfolio summary ─────────────────────────────────────────────────
export interface PortfolioSummary {
  totalItems: number
  totalCostBasis: number
  totalCurrentValue: number
  unrealisedPnl: number
  roiPct: number
  topGainers: PortfolioRow[]
  topLosers: PortfolioRow[]
  categoryBreakdown: { category: string; value: number; cost: number; pnl: number }[]
}
