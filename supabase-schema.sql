-- ═══════════════════════════════════════════════════════════════════════
-- COLLECTIBLE TRACKER v3 — COLLECTOR'S OPERATING SYSTEM
-- Complete production schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists pg_stat_statements;  -- query analytics

-- ═══════════════════════════════════════
-- SUBSCRIPTION TIERS
-- ═══════════════════════════════════════
create table public.subscription_tiers (
  id          text primary key,  -- 'free','premium','enterprise'
  name        text not null,
  price_gbp   numeric(8,2) not null default 0,
  max_watchlist_items     int not null default 10,
  max_collection_items    int not null default 100,
  check_interval_high_sec int not null default 300,  -- 5min for free
  sms_alerts              boolean not null default false,
  portfolio_tracking      boolean not null default false,
  historical_pricing      boolean not null default false,
  investment_tools        boolean not null default false,
  ai_insights             boolean not null default false,
  priority_alerts         boolean not null default false,
  api_access              boolean not null default false,
  features                jsonb not null default '[]',
  created_at              timestamptz not null default now()
);

insert into public.subscription_tiers values
  ('free',       'Free',       0,    10,   100,  300,  false, false, false, false, false, false, false, '["watchlist_10","basic_alerts","release_calendar"]'),
  ('premium',    'Premium',    9.99, 100,  10000,120,  true,  true,  true,  true,  true,  true,  false, '["watchlist_100","sms_alerts","portfolio","ai_insights","price_history","investment_tools","priority_alerts"]'),
  ('enterprise', 'Enterprise', 49.99,1000, 100000,60,  true,  true,  true,  true,  true,  true,  true,  '["unlimited","api_access","retailer_analytics","demand_reports","white_label"]')
on conflict do nothing;

-- ═══════════════════════════════════════
-- CATEGORIES
-- ═══════════════════════════════════════
create table public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  icon_emoji  text,
  color       text default '#7c3aed',
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "Public read categories" on public.categories for select using (true);
create policy "Admin manage categories" on public.categories for all using (
  exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin'))
);

insert into public.categories (name, slug, icon_emoji, color, sort_order) values
  ('Pokémon',        'pokemon',    '⚡', '#FFCB05', 1),
  ('One Piece',      'one-piece',  '☠️', '#D82C2C', 2),
  ('Lorcana',        'lorcana',    '🏰', '#3B82F6', 3),
  ('Yu-Gi-Oh!',      'yugioh',     '👁️', '#8B5CF6', 4),
  ('Magic',          'magic',      '🧙', '#1B5E20', 5),
  ('Digimon',        'digimon',    '🔵', '#0EA5E9', 6),
  ('Flesh & Blood',  'fab',        '⚔️', '#F59E0B', 7),
  ('Sports Cards',   'sports',     '🏆', '#EF4444', 8),
  ('Funko Pop',      'funko',      '👾', '#F97316', 9),
  ('LEGO',           'lego',       '🧱', '#FCD34D', 10),
  ('Sealed Product', 'sealed',     '📦', '#6B7280', 11),
  ('Graded Cards',   'graded',     '💎', '#06B6D4', 12)
on conflict do nothing;

-- ═══════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  display_name    text,
  phone           text,
  avatar_url      text,
  role            text not null default 'user'
    check (role in ('user','admin','super_admin','moderator')),
  -- Subscription
  subscription_tier   text not null default 'free' references public.subscription_tiers(id),
  subscription_status text not null default 'active'
    check (subscription_status in ('active','cancelled','past_due','trialing')),
  subscription_ends_at timestamptz,
  stripe_customer_id   text unique,
  stripe_subscription_id text unique,
  -- Preferences
  theme           text not null default 'system' check (theme in ('light','dark','system')),
  timezone        text not null default 'Europe/London',
  currency        text not null default 'GBP',
  locale          text not null default 'en-GB',
  -- Notifications
  email_alerts              boolean not null default true,
  sms_alerts                boolean not null default false,
  push_alerts               boolean not null default true,
  alert_on_in_stock         boolean not null default true,
  alert_on_preorder         boolean not null default false,
  alert_on_price_drop       boolean not null default true,
  alert_on_collection_value boolean not null default false,
  min_alert_interval_mins   int not null default 30,
  global_max_price          numeric(10,2),
  quiet_hours_enabled       boolean not null default false,
  quiet_start_hour          int not null default 23,
  quiet_end_hour            int not null default 8,
  -- Push
  push_subscription jsonb,
  -- Usage tracking (for tier enforcement)
  watchlist_count   int not null default 0,
  collection_count  int not null default 0,
  -- Onboarding
  onboarding_completed  boolean not null default false,
  onboarding_step       int not null default 0,
  favourite_categories  text[] default '{}',
  -- Analytics
  last_active_at    timestamptz,
  total_sessions    int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users read own profile"    on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile"  on public.profiles for update using (auth.uid() = id);
create policy "Admin reads all profiles"  on public.profiles for select using (
  exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')));

create index idx_profiles_stripe on public.profiles(stripe_customer_id) where stripe_customer_id is not null;
create index idx_profiles_tier on public.profiles(subscription_tier);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end;$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════════════
-- RETAILERS
-- ═══════════════════════════════════════
create table public.retailers (
  id                    uuid primary key default uuid_generate_v4(),
  name                  text not null unique,
  slug                  text not null unique,
  base_url              text not null,
  domain                text not null,
  logo_url              text,
  description           text,
  affiliate_tag         text,  -- for affiliate revenue
  adapter_type          text not null default 'html'
    check (adapter_type in ('shopify','html','api','woocommerce')),
  is_shopify            boolean not null default false,
  is_active             boolean not null default true,
  is_featured           boolean not null default false,
  -- Reliability
  reliability_score     int not null default 80 check (reliability_score between 0 and 100),
  avg_response_ms       int,
  success_rate_7d       numeric(5,2),
  total_checks          bigint not null default 0,
  failed_checks         bigint not null default 0,
  last_check_at         timestamptz,
  last_success_at       timestamptz,
  -- Config
  check_interval_secs   int not null default 180,
  rate_limit_per_min    int not null default 10,
  search_url_template   text,
  price_selector        text,
  stock_selector        text,
  availability_meta     text default 'product:availability',
  requires_js           boolean not null default false,
  -- Geography
  region                text not null default 'GB',
  currency              text not null default 'GBP',
  ships_from            text,
  shipping_cost_gbp     numeric(8,2),
  free_shipping_over    numeric(8,2),
  sort_order            int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
alter table public.retailers enable row level security;
create policy "Public read active retailers" on public.retailers for select using (is_active = true);
create policy "Admin manage retailers" on public.retailers for all using (
  exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')));

-- Pre-populate key UK retailers
insert into public.retailers (name, slug, base_url, domain, adapter_type, is_shopify, check_interval_secs, search_url_template, sort_order, is_featured) values
  ('Smyths Toys',       'smyths',         'https://www.smythstoys.com',        'smythstoys.com',        'html',    false, 180, 'https://www.smythstoys.com/uk/en-gb/search?query={q}',      1, true),
  ('Argos',             'argos',          'https://www.argos.co.uk',           'argos.co.uk',           'html',    false, 240, 'https://www.argos.co.uk/search/{q}/',                       2, true),
  ('GAME',              'game',           'https://www.game.co.uk',            'game.co.uk',            'html',    false, 240, 'https://www.game.co.uk/en-gb/search?query={q}',             3, true),
  ('Amazon UK',         'amazon-uk',      'https://www.amazon.co.uk',          'amazon.co.uk',          'html',    false, 120, 'https://www.amazon.co.uk/s?k={q}&i=toysandgames',           4, true),
  ('HMV',               'hmv',            'https://hmv.com',                   'hmv.com',               'html',    false, 300, 'https://hmv.com/search?query={q}',                          5, false),
  ('Pokémon Center UK', 'pokemon-center', 'https://www.pokemoncenter.com',     'pokemoncenter.com',     'html',    false, 180, 'https://www.pokemoncenter.com/en-gb/search/{q}',            6, true),
  ('Magic Madhouse',    'magic-madhouse', 'https://www.magicmadhouse.co.uk',   'magicmadhouse.co.uk',   'shopify', true,  120, 'https://www.magicmadhouse.co.uk/search?q={q}',              7, true),
  ('Total Cards',       'total-cards',    'https://www.totalcards.net',        'totalcards.net',        'shopify', true,  120, 'https://www.totalcards.net/search?q={q}',                   8, true),
  ('Chaos Cards',       'chaos-cards',    'https://www.chaoscards.co.uk',      'chaoscards.co.uk',      'shopify', true,  120, 'https://www.chaoscards.co.uk/search?q={q}',                 9, true),
  ('Zatu Games',        'zatu',           'https://www.zatugames.com',         'zatugames.com',         'shopify', true,  180, 'https://www.zatugames.com/search?q={q}',                   10, false),
  ('Forbidden Planet',  'forbidden',      'https://forbiddenplanet.com',       'forbiddenplanet.com',   'shopify', true,  180, 'https://forbiddenplanet.com/search/?q={q}',                11, false),
  ('Card Cavern',       'card-cavern',    'https://www.cardcavern.co.uk',      'cardcavern.co.uk',      'shopify', true,  120, 'https://www.cardcavern.co.uk/search?q={q}',                12, false),
  ('PokePost',          'pokepost',       'https://www.pokepost.co.uk',        'pokepost.co.uk',        'shopify', true,  120, 'https://www.pokepost.co.uk/search?q={q}',                  13, false),
  ('Wayland Games',     'wayland',        'https://www.waylandgames.co.uk',    'waylandgames.co.uk',    'shopify', true,  240, 'https://www.waylandgames.co.uk/search?q={q}',              14, false),
  ('Very',              'very',           'https://www.very.co.uk',            'very.co.uk',            'html',    false, 300, 'https://www.very.co.uk/search?q={q}',                      15, false),
  ('The Entertainer',   'entertainer',    'https://www.thetoyshop.com',        'thetoyshop.com',        'html',    false, 300, 'https://www.thetoyshop.com/search?q={q}',                  16, false)
on conflict (slug) do nothing;

-- ═══════════════════════════════════════
-- PRODUCTS
-- ═══════════════════════════════════════
create table public.products (
  id              uuid primary key default uuid_generate_v4(),
  category_id     uuid not null references public.categories(id),
  name            text not null,
  slug            text not null unique,
  -- Aliases for fuzzy matching (e.g. "PE ETB", "prismatic etb")
  aliases         text[] default '{}',
  set_name        text,
  set_code        text,
  product_type    text not null default 'Other',
  series          text,  -- e.g. "Scarlet & Violet"
  description     text,
  image_url       text,
  thumbnail_url   text,
  barcode         text unique,
  release_date    date,
  rrp_gbp         numeric(10,2),
  is_active       boolean not null default true,
  is_featured     boolean not null default false,
  is_prerelease   boolean not null default false,
  -- Demand intelligence (computed from watchlist aggregates)
  demand_score    int not null default 0 check (demand_score between 0 and 100),
  scarcity_score  int not null default 0 check (scarcity_score between 0 and 100),
  hype_score      int not null default 0 check (hype_score between 0 and 100),
  -- Analytics
  view_count      bigint not null default 0,
  watchlist_count int not null default 0,  -- denormalised for performance
  -- Investment data
  investment_rating text check (investment_rating in ('strong_buy','buy','hold','sell','avoid')),
  risk_rating       text check (risk_rating in ('very_low','low','medium','high','very_high')),
  -- Search
  search_vector   tsvector generated always as (
    to_tsvector('english',
      coalesce(name,'') || ' ' ||
      coalesce(set_name,'') || ' ' ||
      coalesce(product_type,'') || ' ' ||
      coalesce(description,'') || ' ' ||
      coalesce(array_to_string(aliases,' '),'')
    )
  ) stored,
  metadata        jsonb default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id)
);
alter table public.products enable row level security;
create policy "Public read active products" on public.products for select using (is_active = true);
create policy "Admin manage products" on public.products for all using (
  exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')));

create index idx_products_search   on public.products using gin(search_vector);
create index idx_products_trgm     on public.products using gin(name gin_trgm_ops);
create index idx_products_aliases  on public.products using gin(aliases);
create index idx_products_category on public.products(category_id);
create index idx_products_release  on public.products(release_date desc nulls last);
create index idx_products_demand   on public.products(demand_score desc);
create index idx_products_featured on public.products(is_featured) where is_featured = true;
create index idx_products_active   on public.products(is_active)   where is_active = true;

-- ═══════════════════════════════════════
-- RETAILER PRODUCTS
-- ═══════════════════════════════════════
create table public.retailer_products (
  id                    uuid primary key default uuid_generate_v4(),
  product_id            uuid not null references public.products(id) on delete cascade,
  retailer_id           uuid not null references public.retailers(id) on delete cascade,
  product_url           text not null,
  fast_buy_url          text,
  variant_id            text,
  sku                   text,
  is_active             boolean not null default true,
  -- Live cache
  current_price         numeric(10,2),
  previous_price        numeric(10,2),  -- for change detection without hitting price_history
  current_stock_status  text not null default 'unknown'
    check (current_stock_status in ('in_stock','sold_out','preorder','backorder','unavailable','unknown')),
  previous_stock_status text,
  -- Timing
  last_checked_at       timestamptz,
  last_in_stock_at      timestamptz,
  last_price_change_at  timestamptz,
  -- Error tracking
  error_count           int not null default 0,
  consecutive_errors    int not null default 0,
  last_error            text,
  last_error_at         timestamptz,
  -- Check config
  check_tier            text not null default 'medium'
    check (check_tier in ('high','medium','low','paused')),
  check_override_secs   int,  -- override the retailer default
  -- Affiliate
  affiliate_url         text,
  commission_rate       numeric(5,4),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users(id),
  unique(product_id, retailer_id)
);
alter table public.retailer_products enable row level security;
create policy "Public read retailer_products" on public.retailer_products for select using (is_active = true);
create policy "Admin manage retailer_products" on public.retailer_products for all using (
  exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')));

create index idx_rp_product    on public.retailer_products(product_id);
create index idx_rp_retailer   on public.retailer_products(retailer_id);
create index idx_rp_status     on public.retailer_products(current_stock_status);
create index idx_rp_tier       on public.retailer_products(check_tier);
create index idx_rp_check_due  on public.retailer_products(last_checked_at asc nulls first) where is_active = true;
create index idx_rp_in_stock   on public.retailer_products(product_id) where current_stock_status = 'in_stock';

-- ═══════════════════════════════════════
-- WATCHLIST
-- ═══════════════════════════════════════
create table public.watchlist (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  product_id            uuid not null references public.products(id) on delete cascade,
  max_price             numeric(10,2),
  desired_quantity      int not null default 1 check (desired_quantity > 0 and desired_quantity <= 99),
  priority              text not null default 'medium' check (priority in ('high','medium','low')),
  alerts_enabled        boolean not null default true,
  alert_on_in_stock     boolean not null default true,
  alert_on_preorder     boolean not null default false,
  alert_on_price_drop   boolean not null default true,
  watch_all_retailers   boolean not null default true,
  specific_retailer_ids uuid[],
  notes                 text,
  added_from            text,  -- 'search','explore','ai_recommendation','share'
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(user_id, product_id)
);
alter table public.watchlist enable row level security;
create policy "Users manage own watchlist" on public.watchlist for all using (auth.uid() = user_id);
create index idx_watchlist_user    on public.watchlist(user_id);
create index idx_watchlist_product on public.watchlist(product_id);
create index idx_watchlist_priority on public.watchlist(user_id, priority);

-- ═══════════════════════════════════════
-- COLLECTION (owned items)
-- ═══════════════════════════════════════
create table public.collection (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  product_id        uuid not null references public.products(id) on delete cascade,
  -- Ownership details
  quantity_owned    int not null default 1 check (quantity_owned > 0),
  quantity_sealed   int not null default 0,
  quantity_opened   int not null default 0,
  condition         text check (condition in ('sealed','mint','near_mint','excellent','good','played','poor')),
  -- Purchase records
  purchase_price_total numeric(10,2),  -- total paid for all units
  purchase_price_each  numeric(10,2),  -- per unit
  purchase_date     date,
  purchase_retailer text,
  purchase_notes    text,
  -- Current valuation
  current_value_each   numeric(10,2),  -- pulled from price_history / eBay
  current_value_total  numeric(10,2),  -- computed
  last_valued_at       timestamptz,
  -- For graded cards
  grade             text,  -- PSA 10, BGS 9.5 etc.
  grading_company   text,  -- PSA, BGS, CGC
  cert_number       text unique,
  -- Display
  is_for_sale       boolean not null default false,
  asking_price      numeric(10,2),
  notes             text,
  tags              text[] default '{}',
  images            text[] default '{}',
  added_from        text,  -- 'manual','barcode','import'
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table public.collection enable row level security;
create policy "Users manage own collection" on public.collection for all using (auth.uid() = user_id);
create index idx_collection_user    on public.collection(user_id);
create index idx_collection_product on public.collection(product_id);
create index idx_collection_cert    on public.collection(cert_number) where cert_number is not null;

-- ═══════════════════════════════════════
-- PRICE HISTORY (time-series, central to moat)
-- ═══════════════════════════════════════
create table public.price_history (
  id                    uuid not null default uuid_generate_v4(),
  retailer_product_id   uuid not null references public.retailer_products(id) on delete cascade,
  product_id            uuid not null references public.products(id) on delete cascade,
  retailer_id           uuid not null references public.retailers(id) on delete cascade,
  price                 numeric(10,2) not null,
  stock_status          text not null default 'unknown',
  source                text not null default 'check'  -- 'check','manual','ebay','import'
    check (source in ('check','manual','ebay','import','api')),
  recorded_at           timestamptz not null default now(),
  primary key (id, recorded_at)
) partition by range (recorded_at);

create table public.price_history_2025 partition of public.price_history for values from ('2025-01-01') to ('2026-01-01');
create table public.price_history_2026 partition of public.price_history for values from ('2026-01-01') to ('2027-01-01');
create table public.price_history_2027 partition of public.price_history for values from ('2027-01-01') to ('2028-01-01');
create table public.price_history_2028 partition of public.price_history for values from ('2028-01-01') to ('2029-01-01');

create index idx_ph_rp_time     on public.price_history(retailer_product_id, recorded_at desc);
create index idx_ph_product     on public.price_history(product_id, recorded_at desc);
create index idx_ph_source      on public.price_history(source, recorded_at desc);

alter table public.price_history enable row level security;
create policy "Premium read price_history" on public.price_history for select using (
  exists(select 1 from public.profiles where id = auth.uid()
    and subscription_tier in ('premium','enterprise'))
  or exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin'))
);
create policy "Service insert price_history" on public.price_history for insert with check (true);

-- ═══════════════════════════════════════
-- STOCK CHECKS (raw log, partitioned)
-- ═══════════════════════════════════════
create table public.stock_checks (
  id                    uuid not null default uuid_generate_v4(),
  retailer_product_id   uuid not null references public.retailer_products(id) on delete cascade,
  price                 numeric(10,2),
  stock_status          text not null,
  http_status           int,
  response_ms           int,
  error_message         text,
  checked_at            timestamptz not null default now(),
  primary key (id, checked_at)
) partition by range (checked_at);

create table public.stock_checks_2025 partition of public.stock_checks for values from ('2025-01-01') to ('2026-01-01');
create table public.stock_checks_2026 partition of public.stock_checks for values from ('2026-01-01') to ('2027-01-01');
create table public.stock_checks_2027 partition of public.stock_checks for values from ('2027-01-01') to ('2028-01-01');

create index idx_sc_rp on public.stock_checks(retailer_product_id, checked_at desc);

alter table public.stock_checks enable row level security;
create policy "Admin reads stock_checks" on public.stock_checks for select using (
  exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')));
create policy "Service insert stock_checks" on public.stock_checks for insert with check (true);

-- ═══════════════════════════════════════
-- STOCK EVENTS (meaningful changes only)
-- ═══════════════════════════════════════
create table public.stock_events (
  id                    uuid primary key default uuid_generate_v4(),
  retailer_product_id   uuid not null references public.retailer_products(id) on delete cascade,
  product_id            uuid not null references public.products(id) on delete cascade,
  retailer_id           uuid not null references public.retailers(id) on delete cascade,
  event_type            text not null check (event_type in
    ('in_stock','sold_out','preorder','backorder','price_drop','price_rise','unavailable','error')),
  previous_status       text,
  new_status            text,
  previous_price        numeric(10,2),
  new_price             numeric(10,2),
  price_change_gbp      numeric(10,2),
  price_change_pct      numeric(6,2),
  fast_buy_url          text,
  product_url           text not null,
  time_out_of_stock_mins int,  -- how long was it sold out? (for demand scoring)
  created_at            timestamptz not null default now()
);
alter table public.stock_events enable row level security;
create policy "Authenticated read stock_events" on public.stock_events for select to authenticated using (true);
create policy "Service insert stock_events" on public.stock_events for insert with check (true);

create index idx_se_product   on public.stock_events(product_id, created_at desc);
create index idx_se_retailer  on public.stock_events(retailer_id, created_at desc);
create index idx_se_type      on public.stock_events(event_type, created_at desc);
create index idx_se_created   on public.stock_events(created_at desc);

-- ═══════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════
create table public.notifications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  stock_event_id  uuid references public.stock_events(id) on delete set null,
  product_id      uuid references public.products(id) on delete set null,
  retailer_id     uuid references public.retailers(id) on delete set null,
  channel         text not null check (channel in ('push','email','sms','in_app')),
  status          text not null default 'pending'
    check (status in ('pending','sent','failed','skipped')),
  title           text,
  body            text,
  product_url     text,
  fast_buy_url    text,
  price           numeric(10,2),
  icon_url        text,
  action_url      text,
  error_message   text,
  retry_count     int not null default 0,
  sent_at         timestamptz,
  read_at         timestamptz,
  clicked_at      timestamptz,  -- track CTR
  created_at      timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "Users read own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Service manage notifications" on public.notifications for all with check (true);

create index idx_notif_user    on public.notifications(user_id, created_at desc);
create index idx_notif_unread  on public.notifications(user_id, read_at) where read_at is null;
create index idx_notif_pending on public.notifications(status) where status = 'pending';

-- ═══════════════════════════════════════
-- DAILY MARKET SUMMARY (pre-computed, cron)
-- ═══════════════════════════════════════
create table public.market_summaries (
  id                  uuid primary key default uuid_generate_v4(),
  date                date not null unique,
  -- Top movers
  top_gainers         jsonb default '[]',  -- [{product_id, name, change_pct}]
  top_losers          jsonb default '[]',
  most_restocked      jsonb default '[]',  -- [{product_id, name, restock_count}]
  most_watched        jsonb default '[]',  -- [{product_id, name, watchlist_count}]
  new_in_stock        jsonb default '[]',
  -- Market stats
  total_restock_events int not null default 0,
  total_price_drops    int not null default 0,
  total_price_rises    int not null default 0,
  avg_price_change_pct numeric(6,2),
  -- AI summary
  ai_summary          text,
  ai_highlights       jsonb default '[]',
  generated_at        timestamptz not null default now()
);
alter table public.market_summaries enable row level security;
create policy "Authenticated read market_summaries" on public.market_summaries
  for select to authenticated using (true);
create policy "Service manage market_summaries" on public.market_summaries for all with check (true);
create index idx_ms_date on public.market_summaries(date desc);

-- ═══════════════════════════════════════
-- PRODUCT DEMAND SCORES (daily snapshot)
-- ═══════════════════════════════════════
create table public.demand_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid not null references public.products(id) on delete cascade,
  date            date not null,
  watchlist_count int not null default 0,
  view_count      int not null default 0,
  restock_count   int not null default 0,
  avg_time_in_stock_mins int,
  avg_time_out_stock_mins int,
  demand_score    int not null default 0,
  scarcity_score  int not null default 0,
  unique(product_id, date)
);
alter table public.demand_snapshots enable row level security;
create policy "Authenticated read demand_snapshots" on public.demand_snapshots
  for select to authenticated using (true);
create index idx_ds_product on public.demand_snapshots(product_id, date desc);
create index idx_ds_date    on public.demand_snapshots(date desc);

-- ═══════════════════════════════════════
-- RELEASE CALENDAR
-- ═══════════════════════════════════════
create table public.release_calendar (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid references public.products(id) on delete set null,
  category_id   uuid references public.categories(id),
  name          text not null,
  set_name      text,
  product_type  text,
  release_date  date not null,
  image_url     text,
  description   text,
  rrp_gbp       numeric(10,2),
  is_confirmed  boolean not null default false,
  preorder_url  text,
  source_url    text,
  hype_score    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.release_calendar enable row level security;
create policy "Public read release_calendar" on public.release_calendar for select using (true);
create policy "Admin manage release_calendar" on public.release_calendar for all using (
  exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')));
create index idx_rc_date     on public.release_calendar(release_date);
create index idx_rc_category on public.release_calendar(category_id);

-- ═══════════════════════════════════════
-- AUDIT LOG
-- ═══════════════════════════════════════
create table public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete set null,
  action      text not null,
  table_name  text,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "Admin reads audit_log" on public.audit_log for select using (
  exists(select 1 from public.profiles where id = auth.uid() and role in ('admin','super_admin')));
create policy "Service inserts audit_log" on public.audit_log for insert with check (true);
create index idx_audit_user   on public.audit_log(user_id, created_at desc);
create index idx_audit_action on public.audit_log(action, created_at desc);

-- ═══════════════════════════════════════
-- STRIPE EVENTS (webhook log)
-- ═══════════════════════════════════════
create table public.stripe_events (
  id            text primary key,  -- Stripe event ID
  type          text not null,
  processed     boolean not null default false,
  data          jsonb not null,
  error         text,
  created_at    timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
create policy "Service manage stripe_events" on public.stripe_events for all with check (true);

-- ═══════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════

-- Products with live availability
create or replace view public.v_products as
select
  p.*,
  c.name        as category_name,
  c.slug        as category_slug,
  c.color       as category_color,
  c.icon_emoji  as category_icon,
  count(rp.id) filter (where rp.current_stock_status = 'in_stock') as in_stock_count,
  count(rp.id) filter (where rp.is_active)                         as retailer_count,
  min(rp.current_price) filter (where rp.current_stock_status = 'in_stock') as best_price,
  max(rp.last_in_stock_at) as last_in_stock_at
from public.products p
join public.categories c on c.id = p.category_id
left join public.retailer_products rp on rp.product_id = p.id
group by p.id, c.id;

-- Watchlist with product + availability
create or replace view public.v_watchlist as
select
  w.*,
  p.name          as product_name,
  p.set_name,
  p.product_type,
  p.image_url,
  p.thumbnail_url,
  p.rrp_gbp,
  p.demand_score,
  p.investment_rating,
  c.name          as category_name,
  c.slug          as category_slug,
  c.color         as category_color,
  c.icon_emoji    as category_icon,
  vp.in_stock_count,
  vp.retailer_count,
  vp.best_price,
  vp.last_in_stock_at
from public.watchlist w
join public.products p  on p.id = w.product_id
join public.categories c on c.id = p.category_id
join public.v_products vp on vp.id = w.product_id;

-- Portfolio summary per user
create or replace view public.v_portfolio as
select
  col.user_id,
  col.product_id,
  p.name          as product_name,
  p.set_name,
  p.product_type,
  p.image_url,
  c.name          as category_name,
  c.color         as category_color,
  col.quantity_owned,
  col.quantity_sealed,
  col.quantity_opened,
  col.condition,
  col.purchase_price_total,
  col.purchase_price_each,
  col.purchase_date,
  col.current_value_each,
  col.current_value_total,
  col.grade,
  col.grading_company,
  -- P&L
  (col.current_value_total - coalesce(col.purchase_price_total, 0)) as unrealised_pnl,
  case when col.purchase_price_total > 0
    then round(((col.current_value_total - col.purchase_price_total) / col.purchase_price_total * 100)::numeric, 2)
    else null end as roi_pct,
  col.created_at,
  col.updated_at
from public.collection col
join public.products p    on p.id = col.product_id
join public.categories c  on c.id = p.category_id;

-- ═══════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════

-- Fuzzy product search with alias support
create or replace function public.search_products(
  p_query      text default null,
  p_category   text default null,
  p_type       text default null,
  p_in_stock   boolean default null,
  p_limit      int default 20,
  p_offset     int default 0,
  p_sort       text default 'relevance'
) returns table (
  id uuid, name text, slug text, set_name text, product_type text, series text,
  image_url text, thumbnail_url text, rrp_gbp numeric, aliases text[],
  category_name text, category_slug text, category_color text, category_icon text,
  in_stock_count bigint, retailer_count bigint, best_price numeric,
  last_in_stock_at timestamptz, demand_score int, investment_rating text,
  rank real
) language plpgsql security definer as $$
declare
  ts_query tsquery;
begin
  -- Build tsquery safely
  begin
    ts_query := websearch_to_tsquery('english', p_query);
  exception when others then
    ts_query := null;
  end;

  return query
  select
    vp.id, vp.name, vp.slug, vp.set_name, vp.product_type, vp.series,
    vp.image_url, vp.thumbnail_url, vp.rrp_gbp, vp.aliases,
    vp.category_name, vp.category_slug, vp.category_color, vp.category_icon,
    vp.in_stock_count, vp.retailer_count, vp.best_price, vp.last_in_stock_at,
    vp.demand_score, vp.investment_rating,
    (
      coalesce(ts_rank(vp.search_vector, ts_query) * 3.0, 0) +
      coalesce(similarity(vp.name, coalesce(p_query,'')), 0) * 2.0 +
      (case when exists(
        select 1 from unnest(vp.aliases) a where a ilike '%' || coalesce(p_query,'') || '%'
      ) then 1.5 else 0 end) +
      (vp.demand_score::float / 100.0) * 0.5
    )::real as rank
  from public.v_products vp
  where
    vp.is_active = true
    and (p_query is null or p_query = '' or (
      (ts_query is not null and vp.search_vector @@ ts_query)
      or similarity(vp.name, p_query) > 0.1
      or exists(select 1 from unnest(vp.aliases) a where a ilike '%' || p_query || '%')
    ))
    and (p_category is null or vp.category_slug = p_category)
    and (p_type is null or vp.product_type ilike p_type)
    and (p_in_stock is null or (p_in_stock = true and vp.in_stock_count > 0) or p_in_stock = false)
  order by
    case p_sort
      when 'price_asc'   then null::real
      when 'price_desc'  then null::real
      when 'newest'      then null::real
      when 'demand'      then vp.demand_score::real
      else rank
    end desc nulls last,
    case when p_sort = 'price_asc'   then vp.best_price end asc  nulls last,
    case when p_sort = 'price_desc'  then vp.best_price end desc nulls last,
    case when p_sort = 'newest'      then extract(epoch from vp.created_at) end desc nulls last,
    vp.in_stock_count desc, vp.name
  limit p_limit offset p_offset;
end;$$;

-- Update retailer reliability
create or replace function public.update_retailer_reliability(
  p_retailer_id uuid, p_response_ms int, p_success boolean
) returns void language plpgsql security definer as $$
begin
  update public.retailers set
    total_checks    = total_checks + 1,
    failed_checks   = failed_checks + (case when p_success then 0 else 1 end),
    avg_response_ms = ((coalesce(avg_response_ms,0) * 9 + p_response_ms) / 10)::int,
    last_check_at   = now(),
    last_success_at = case when p_success then now() else last_success_at end,
    updated_at      = now()
  where id = p_retailer_id;
end;$$;

-- Compute daily demand scores (called by cron)
create or replace function public.compute_demand_scores() returns void language plpgsql security definer as $$
begin
  -- Update products.demand_score based on watchlist count, views, restock frequency
  update public.products p set
    demand_score = least(100, (
      -- Watchlist weight (0-60)
      least(60, (select count(*) from public.watchlist w where w.product_id = p.id) * 3) +
      -- Recent restock events weight (0-30)
      least(30, (
        select count(*) * 5
        from public.stock_events se
        where se.product_id = p.id
          and se.event_type = 'in_stock'
          and se.created_at > now() - interval '30 days'
      )) +
      -- View count weight (0-10)
      least(10, (p.view_count / 100))
    )::int),
    watchlist_count = (select count(*) from public.watchlist w where w.product_id = p.id)
  where p.is_active = true;

  -- Insert daily snapshots
  insert into public.demand_snapshots (product_id, date, watchlist_count, view_count, demand_score)
  select
    p.id, current_date,
    (select count(*) from public.watchlist w where w.product_id = p.id),
    p.view_count, p.demand_score
  from public.products p
  where p.is_active = true
  on conflict (product_id, date) do update set
    watchlist_count = excluded.watchlist_count,
    view_count      = excluded.view_count,
    demand_score    = excluded.demand_score;
end;$$;

-- Compute daily market summary
create or replace function public.compute_market_summary(p_date date default current_date)
returns void language plpgsql security definer as $$
declare
  v_gainers jsonb;
  v_losers  jsonb;
  v_restocked jsonb;
  v_watched jsonb;
begin
  -- Top gainers (price dropped the most yesterday = bargains)
  select jsonb_agg(row_to_json(t)) into v_gainers from (
    select p.id as product_id, p.name, p.slug,
           round(((se.new_price - se.previous_price) / nullif(se.previous_price,0) * 100)::numeric, 1) as change_pct,
           se.new_price, se.previous_price
    from public.stock_events se
    join public.products p on p.id = se.product_id
    where se.event_type = 'price_drop'
      and se.created_at >= p_date
      and se.created_at <  p_date + 1
    order by change_pct asc limit 5
  ) t;

  -- Most restocked
  select jsonb_agg(row_to_json(t)) into v_restocked from (
    select p.id as product_id, p.name, p.slug, count(*) as restock_count
    from public.stock_events se
    join public.products p on p.id = se.product_id
    where se.event_type = 'in_stock'
      and se.created_at >= p_date
      and se.created_at <  p_date + 1
    group by p.id, p.name, p.slug
    order by restock_count desc limit 10
  ) t;

  -- Most watched products
  select jsonb_agg(row_to_json(t)) into v_watched from (
    select p.id as product_id, p.name, p.slug, p.watchlist_count, p.demand_score
    from public.products p
    order by p.watchlist_count desc limit 10
  ) t;

  insert into public.market_summaries (date, top_gainers, most_restocked, most_watched, generated_at)
  values (p_date, coalesce(v_gainers,'[]'), coalesce(v_restocked,'[]'), coalesce(v_watched,'[]'), now())
  on conflict (date) do update set
    top_gainers    = excluded.top_gainers,
    most_restocked = excluded.most_restocked,
    most_watched   = excluded.most_watched,
    generated_at   = excluded.generated_at;
end;$$;

-- Check tier limit for free users
create or replace function public.check_watchlist_limit(p_user_id uuid)
returns boolean language plpgsql security definer as $$
declare
  v_count int;
  v_limit int;
begin
  select count(*) into v_count from public.watchlist where user_id = p_user_id;
  select st.max_watchlist_items into v_limit
  from public.profiles pr
  join public.subscription_tiers st on st.id = pr.subscription_tier
  where pr.id = p_user_id;
  return v_count < coalesce(v_limit, 10);
end;$$;

-- Updated_at triggers
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;$$;

create trigger trg_profiles_upd   before update on public.profiles   for each row execute procedure public.set_updated_at();
create trigger trg_retailers_upd  before update on public.retailers  for each row execute procedure public.set_updated_at();
create trigger trg_products_upd   before update on public.products   for each row execute procedure public.set_updated_at();
create trigger trg_rp_upd         before update on public.retailer_products for each row execute procedure public.set_updated_at();
create trigger trg_watchlist_upd  before update on public.watchlist  for each row execute procedure public.set_updated_at();
create trigger trg_collection_upd before update on public.collection for each row execute procedure public.set_updated_at();

-- ═══════════════════════════════════════
-- SEED: PRODUCTS
-- ═══════════════════════════════════════
insert into public.products (category_id, name, slug, set_name, set_code, product_type, series, release_date, rrp_gbp, aliases, demand_score, is_featured)
select c.id, p.name, p.slug, p.set_name, p.set_code, p.product_type, 'Scarlet & Violet', p.release_date::date, p.rrp, p.aliases::text[], p.demand, p.featured
from public.categories c
cross join (values
  ('Prismatic Evolutions Elite Trainer Box','pe-etb','Prismatic Evolutions','SV8.5','Elite Trainer Box','2025-01-24',49.99,'{"PE ETB","Prismatic ETB","Eevee ETB"}',95,true),
  ('Prismatic Evolutions Pokemon Center ETB','pe-etb-pc','Prismatic Evolutions','SV8.5','Elite Trainer Box','2025-01-24',54.99,'{"PE PC ETB","Pokemon Center Prismatic"}',90,true),
  ('Prismatic Evolutions Booster Bundle','pe-bundle','Prismatic Evolutions','SV8.5','Booster Bundle','2025-01-24',24.99,'{"PE Bundle","Prismatic Bundle"}',85,false),
  ('Prismatic Evolutions Super Premium Collection','pe-spc','Prismatic Evolutions','SV8.5','Premium Collection','2025-01-24',119.99,'{"PE SPC","Prismatic SPC","Eevee SPC"}',92,true),
  ('Prismatic Evolutions Vaporeon Tin','pe-tin-vaporeon','Prismatic Evolutions','SV8.5','Tin','2025-01-24',8.99,'{"Vaporeon Tin","PE Vaporeon"}',60,false),
  ('Prismatic Evolutions Jolteon Tin','pe-tin-jolteon','Prismatic Evolutions','SV8.5','Tin','2025-01-24',8.99,'{"Jolteon Tin","PE Jolteon"}',58,false),
  ('Prismatic Evolutions Flareon Tin','pe-tin-flareon','Prismatic Evolutions','SV8.5','Tin','2025-01-24',8.99,'{"Flareon Tin","PE Flareon"}',57,false),
  ('Prismatic Evolutions Espeon Tin','pe-tin-espeon','Prismatic Evolutions','SV8.5','Tin','2025-01-24',8.99,'{"Espeon Tin","PE Espeon"}',62,false),
  ('Prismatic Evolutions Umbreon Tin','pe-tin-umbreon','Prismatic Evolutions','SV8.5','Tin','2025-01-24',8.99,'{"Umbreon Tin","PE Umbreon"}',70,false),
  ('Prismatic Evolutions Booster Pack','pe-pack','Prismatic Evolutions','SV8.5','Booster Pack','2025-01-24',4.99,'{"PE Pack","Prismatic Pack"}',65,false),
  ('Destined Rivals Elite Trainer Box','dr-etb','Destined Rivals','SV10','Elite Trainer Box','2025-05-30',44.99,'{"DR ETB","Destined ETB"}',88,true),
  ('Destined Rivals Pokemon Center ETB','dr-etb-pc','Destined Rivals','SV10','Elite Trainer Box','2025-05-30',49.99,'{"DR PC ETB"}',82,false),
  ('Destined Rivals Booster Box','dr-bbox','Destined Rivals','SV10','Booster Box','2025-05-30',139.99,'{"DR Booster Box","Destined Rivals BB"}',90,true),
  ('Destined Rivals Booster Bundle','dr-bundle','Destined Rivals','SV10','Booster Bundle','2025-05-30',22.99,'{"DR Bundle"}',75,false),
  ('Destined Rivals Booster Pack','dr-pack','Destined Rivals','SV10','Booster Pack','2025-05-30',4.99,'{"DR Pack"}',60,false),
  ('Ascended Heroes Elite Trainer Box','ah-etb','Ascended Heroes','SV11','Elite Trainer Box','2026-01-30',44.99,'{"AH ETB","Ascended ETB","Mega ETB"}',78,true),
  ('Ascended Heroes Pokemon Center ETB','ah-etb-pc','Ascended Heroes','SV11','Elite Trainer Box','2026-01-30',49.99,'{"AH PC ETB"}',72,false),
  ('Ascended Heroes Booster Bundle','ah-bundle','Ascended Heroes','SV11','Booster Bundle','2026-01-30',22.99,'{"AH Bundle","Ascended Bundle"}',68,false),
  ('Ascended Heroes Premium Poster Collection Mega Lucario','ah-ppc-lucario','Ascended Heroes','SV11','Premium Collection','2026-01-30',34.99,'{"Lucario PPC","Mega Lucario Collection"}',80,true),
  ('Ascended Heroes Premium Poster Collection Mega Gardevoir','ah-ppc-gardevoir','Ascended Heroes','SV11','Premium Collection','2026-01-30',34.99,'{"Gardevoir PPC","Mega Gardevoir Collection"}',82,true),
  ('Ascended Heroes Booster Pack','ah-pack','Ascended Heroes','SV11','Booster Pack','2026-01-30',4.99,'{"AH Pack"}',55,false)
) as p(name,slug,set_name,set_code,product_type,release_date,rrp,aliases,demand,featured)
where c.slug = 'pokemon'
on conflict (slug) do nothing;

-- Release calendar
insert into public.release_calendar (category_id, name, set_name, product_type, release_date, rrp_gbp, is_confirmed)
select c.id, e.name, e.sn, e.pt, e.rd::date, e.rrp, e.conf
from public.categories c
cross join (values
  ('Prismatic Evolutions ETB',         'Prismatic Evolutions','Elite Trainer Box','2025-01-24',49.99,true),
  ('Destined Rivals ETB',              'Destined Rivals',     'Elite Trainer Box','2025-05-30',44.99,true),
  ('Destined Rivals Booster Box',      'Destined Rivals',     'Booster Box',      '2025-05-30',139.99,true),
  ('Ascended Heroes ETB',              'Ascended Heroes',     'Elite Trainer Box','2026-01-30',44.99,true),
  ('Ascended Heroes Booster Bundle',   'Ascended Heroes',     'Booster Bundle',   '2026-01-30',22.99,true),
  ('Paldea Evolved ETB (estimated)',   'Paldea Evolved',      'Elite Trainer Box','2026-06-01',44.99,false)
) as e(name,sn,pt,rd,rrp,conf)
where c.slug = 'pokemon'
on conflict do nothing;

