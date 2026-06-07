# Collectible Tracker v3 — Collector's Operating System

## What this is

The definitive stock tracking, collection management, and market intelligence platform for UK collectors. Tracks Pokémon, One Piece, Lorcana, Yu-Gi-Oh!, sports cards, Funko, LEGO and all other collectibles.

**User flow:**
Search product → Click Track → Set alert preferences → Receive push/email/SMS when restocked → Tap direct link → Buy immediately

---

## Architecture

```
Browser / PWA (Next.js 14 App Router)
  ↓ Supabase Auth (JWT)
PostgreSQL (Supabase) — RLS on every table
  ↑ populated every 2-15 min by
Vercel Cron Jobs
  → Stock Checkers (Shopify .json + HTML scraper)
  → Creates stock_events
  → Notification Dispatcher (Push + Email + SMS)
  → Demand scorer (every 4h)
  → Market summary generator (daily 6am)
  → Portfolio valuation updater (daily 8am)
  → Cleanup job (daily 3am)
```

---

## 30-Minute Setup

### 1. Install
```bash
git clone https://github.com/you/collectible-tracker
cd collectible-tracker
npm install
cp .env.local.example .env.local
```

### 2. Supabase
1. Create project at [supabase.com](https://supabase.com)
2. SQL Editor → paste entire `supabase-schema.sql` → Run
3. Settings → API → copy URL, anon key, service role key → `.env.local`

### 3. VAPID keys (push notifications)
```bash
npx web-push generate-vapid-keys
```
Paste both into `.env.local`.

### 4. Resend (email)
1. [resend.com](https://resend.com) → Domains → verify your domain
2. Create API key → `.env.local`

### 5. Twilio (SMS — Premium tier only)
```
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER → .env.local
```

### 6. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 7. Deploy
```bash
npm i -g vercel
vercel
# Add all .env.local vars in Vercel → Settings → Environment Variables
# Cron jobs in vercel.json run automatically on Pro plan
```

### 8. Make yourself admin
```sql
update public.profiles set role = 'admin' where email = 'your@email.com';
```

---

## Adding Product URLs

The `retailer_products` table links each product to each retailer with its direct product URL. This is the key field — it must go straight to the product page, not the homepage.

Via Supabase SQL editor:
```sql
insert into public.retailer_products (product_id, retailer_id, product_url, check_tier)
select p.id, r.id, 'https://www.magicmadhouse.co.uk/products/pokemon-prismatic-evolutions-elite-trainer-box', 'high'
from public.products p, public.retailers r
where p.slug = 'pe-etb' and r.slug = 'magic-madhouse';
```

Or use the Admin Panel at `/admin/products`.

---

## Tier Features

| Feature                    | Free   | Premium (£9.99) | Enterprise (£49.99) |
|----------------------------|--------|-----------------|---------------------|
| Watchlist items            | 10     | 100             | Unlimited           |
| Check interval             | 5 min  | 2 min           | 1 min               |
| SMS alerts                 | ✗      | ✓               | ✓                   |
| Portfolio tracking         | ✗      | ✓               | ✓                   |
| Price history              | ✗      | ✓               | ✓                   |
| AI insights                | ✗      | ✓               | ✓                   |
| API access                 | ✗      | ✗               | ✓                   |
| Retailer demand analytics  | ✗      | ✗               | ✓                   |

---

## Icon Generation

You need icon files in `public/icons/`. Generate them from a single 512×512 PNG:
```bash
# Using sharp or any PWA icon generator
# Required: icon-72.png, icon-96.png, icon-128.png, icon-192.png, icon-512.png, badge-96.png
```

Or use [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator).

---

## See Also
- `ROADMAP.md` — strategic roadmap and competitive moat analysis
- `supabase-schema.sql` — complete 958-line production database schema
