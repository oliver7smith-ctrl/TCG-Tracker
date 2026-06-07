# Collectible Tracker — Strategic Roadmap

## Phase 1: Foundation (Now) ✅
**Goal: Get 1,000 active users. Prove the core loop.**

The current build delivers:
- Stock tracking across 20+ UK retailers (Shopify + HTML adapters)
- Push/email/SMS notifications with quiet hours and cooldown
- Collection management with P&L tracking
- Portfolio dashboard (Premium)
- Market intelligence with daily AI summaries
- Fuzzy product search with alias support
- Demand scoring from watchlist aggregates
- Release calendar
- Free/Premium/Enterprise tier structure
- Vercel cron-based checking (every 2/5/15 min by tier)
- PWA — installable on iPhone and Android

---

## Phase 2: Retention Engine (Month 2-3)
**Goal: Daily active usage. Users open the app without a restock trigger.**

### Features
- [ ] **Daily digest email** — 6am UTC: what restocked yesterday, what's dropping today, collection value change, upcoming releases this week
- [ ] **Weekly portfolio report** — every Monday: ROI summary, biggest movers, what to watch
- [ ] **Price alert thresholds** — "alert me when Prismatic ETB drops below £45"
- [ ] **Restock timing intelligence** — "This product typically restocks Tuesdays. Check back then."
- [ ] **Collection value push alert** — "Your collection value changed by +£28.50 this week"
- [ ] **Smart watchlist suggestions** — "Users tracking PE ETB also watch DR Booster Box"
- [ ] **Barcode scanner** (PWA camera API) — scan a product to add to collection instantly
- [ ] **eBay sold price integration** — secondary market pricing for collection valuation
- [ ] **Share a watchlist** — public shareable link to your watchlist
- [ ] **Follow another collector** — see what they're tracking

### Database additions needed
```sql
create table public.price_alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  retailer_id uuid references public.retailers(id),
  target_price numeric(10,2) not null,
  direction text not null default 'below' check (direction in ('below','above')),
  is_active boolean not null default true,
  triggered_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.user_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create table public.ebay_prices (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  sold_price numeric(10,2) not null,
  condition text,
  sold_at timestamptz not null,
  listing_url text,
  source text not null default 'ebay_uk',
  created_at timestamptz not null default now()
);
```

---

## Phase 3: Competitive Moat (Month 3-6)
**Goal: Data nobody else has. Platform that would take 3+ years to replicate.**

### Proprietary data assets to build
1. **UK retail stock timing database** — when does each retailer restock? Day of week, time of day patterns. Derivable from `stock_events` after 3 months of data.
2. **Demand-weighted price prediction** — combine watchlist count + restock velocity + eBay secondary prices to predict future retail value.
3. **Retailer reliability index** — published monthly. PR value + SEO.
4. **TCG market index** — like a stock index but for Pokémon ETBs. Publishable externally.

### Features
- [ ] **AI restock predictions** — "This product has a 78% chance of restocking in the next 7 days based on historical patterns"
- [ ] **Investment ratings** — Strong Buy / Buy / Hold / Sell / Avoid per product, updated daily
- [ ] **Price prediction** — "Based on demand trends, this ETB is likely to trade at £65-75 in 6 months"
- [ ] **Discord integration** — webhook alerts to Discord servers
- [ ] **Telegram bot** — track via Telegram
- [ ] **Browser extension** — highlight "tracked" status when browsing retailer sites
- [ ] **eBay auto-lister** — one-tap list your collection items on eBay at market price
- [ ] **Community watchlists** — "Top 10 most-tracked this week"

---

## Phase 4: Platform Expansion (Month 6-12)
**Goal: Dominant in UK. Begin international expansion.**

### New categories
- Sports cards (Topps, Panini, Upper Deck)
- Funko Pop tracking
- LEGO retired set tracking
- Graded card database (PSA, BGS, CGC integration)

### New markets
- US retailer adapters (Target, Walmart, GameStop, TCGPlayer)
- EU adapters (Müller, JPC, Cardtrader)

### React Native app
- iOS native app (push via APNS)
- Android native app (push via FCM)
- Barcode scanning
- Lock screen widgets
- Live Activities (iOS) for watched items

---

## Phase 5: B2B / Enterprise (Year 2)
**Goal: Revenue diversification. Platform data has commercial value.**

### Enterprise offerings
- **Retailer analytics** — sell demand data back to retailers: "Which of your products has 2,000+ watchlist adds in the last 30 days?" Let them know before they're out of stock.
- **Publisher intelligence** — Pokémon Company, Konami, Wizards: which sets are most anticipated? What's the demand index for the next set?
- **Investment fund integration** — collectibles investment funds need market data
- **Insurance integration** — "Your collection is worth £12,400 — here's a policy quote"

---

## Revenue Strategy

| Tier       | Price    | Users    | MRR (at target) |
|------------|----------|----------|-----------------|
| Free       | £0       | 8,000    | £0              |
| Premium    | £9.99/mo | 1,500    | £14,985         |
| Enterprise | £49.99/mo| 100      | £4,999          |
| **Total**  |          | **9,600**| **~£20k MRR**   |

At £20k MRR and 10,000 users: Series A ready.

---

## Competitive Moat Summary

| Feature | Build time | Replication difficulty |
|---|---|---|
| Stock history database | 3 months passively | Very hard — needs 3+ months of data |
| Demand scoring from watchlists | Already built | Hard — needs user scale |
| Restock timing patterns | 3 months passively | Hard — needs data |
| Collection / portfolio data | Already built | Medium — switching cost |
| AI predictions | Month 3-6 | Medium — but requires proprietary data |
| Community network effects | Month 3+ | Hard — winner-takes-all dynamic |
| Retailer intelligence reports | Month 6+ | Very hard — needs data + relationships |

---

## Features to Remove (scope debt)
- Nothing from the current build is dead weight
- Defer: eBay auto-lister, browser extension, Discord/Telegram (Phase 3)
- Never build: general social network features, user-generated product content (moderation cost)

---

## Architecture for 10,000+ Users

| Concern | Current solution | Scales to |
|---|---|---|
| Database | Supabase Pro | 10k concurrent connections |
| Cron / checks | Vercel cron + batched | ~500 checks/min |
| Push notifications | web-push direct | 50k/day |
| Email | Resend | 100k/day |
| SMS | Twilio | 10k/day |
| Images | Next.js Image + CDN | Unlimited |
| Search | PostgreSQL FTS + trgm | 100k products |

**At 100k+ users:** migrate cron to Inngest or Trigger.dev, add Supabase read replicas, move to Resend broadcast for digests.
