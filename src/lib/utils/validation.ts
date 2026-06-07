
import { z } from "zod"

export const WatchlistSchema = z.object({
  product_id:           z.string().uuid(),
  max_price:            z.number().positive().nullable().optional(),
  desired_quantity:     z.number().int().min(1).max(99).default(1),
  priority:             z.enum(["high","medium","low"]).default("medium"),
  alerts_enabled:       z.boolean().default(true),
  alert_on_in_stock:    z.boolean().default(true),
  alert_on_preorder:    z.boolean().default(false),
  alert_on_price_drop:  z.boolean().default(true),
  watch_all_retailers:  z.boolean().default(true),
  specific_retailer_ids:z.array(z.string().uuid()).optional(),
  notes:                z.string().max(500).optional(),
})

export const CollectionSchema = z.object({
  product_id:           z.string().uuid(),
  quantity_owned:       z.number().int().min(1).max(9999).default(1),
  quantity_sealed:      z.number().int().min(0).default(1),
  quantity_opened:      z.number().int().min(0).default(0),
  condition:            z.enum(["sealed","mint","near_mint","excellent","good","played","poor"]).optional(),
  purchase_price_total: z.number().positive().optional().nullable(),
  purchase_price_each:  z.number().positive().optional().nullable(),
  purchase_date:        z.string().optional().nullable(),
  purchase_retailer:    z.string().max(100).optional().nullable(),
  purchase_notes:       z.string().max(500).optional().nullable(),
  grade:                z.string().max(20).optional().nullable(),
  grading_company:      z.string().max(20).optional().nullable(),
  cert_number:          z.string().max(50).optional().nullable(),
  notes:                z.string().max(1000).optional().nullable(),
  tags:                 z.array(z.string()).optional(),
  added_from:           z.string().optional(),
})

export const ProfileUpdateSchema = z.object({
  display_name:             z.string().min(1).max(60).optional(),
  phone:                    z.string().regex(/^\+[1-9]\d{7,14}$/).optional().nullable(),
  theme:                    z.enum(["light","dark","system"]).optional(),
  email_alerts:             z.boolean().optional(),
  sms_alerts:               z.boolean().optional(),
  push_alerts:              z.boolean().optional(),
  alert_on_in_stock:        z.boolean().optional(),
  alert_on_preorder:        z.boolean().optional(),
  alert_on_price_drop:      z.boolean().optional(),
  min_alert_interval_mins:  z.number().int().min(5).max(1440).optional(),
  global_max_price:         z.number().positive().nullable().optional(),
  quiet_hours_enabled:      z.boolean().optional(),
  quiet_start_hour:         z.number().int().min(0).max(23).optional(),
  quiet_end_hour:           z.number().int().min(0).max(23).optional(),
  favourite_categories:     z.array(z.string()).optional(),
  onboarding_completed:     z.boolean().optional(),
})

export const ProductSchema = z.object({
  category_id:    z.string().uuid(),
  name:           z.string().min(2).max(250),
  set_name:       z.string().max(100).optional().nullable(),
  product_type:   z.string().max(80),
  series:         z.string().max(100).optional().nullable(),
  description:    z.string().max(2000).optional().nullable(),
  image_url:      z.string().url().optional().nullable(),
  release_date:   z.string().optional().nullable(),
  rrp_gbp:        z.number().positive().optional().nullable(),
  aliases:        z.array(z.string()).optional(),
})

export const RetailerProductSchema = z.object({
  product_id:   z.string().uuid(),
  retailer_id:  z.string().uuid(),
  product_url:  z.string().url(),
  check_tier:   z.enum(["high","medium","low","paused"]).default("medium"),
})
