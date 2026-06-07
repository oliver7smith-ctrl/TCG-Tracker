
-- =================================================================
-- FOUNDER ACCESS SYSTEM -- run this AFTER supabase-schema.sql
-- =================================================================

-- Add "founder" tier
insert into public.subscription_tiers values
  ('founder', 'Founder', 0, 999999, 999999, 60, true, true, true, true, true, true, true,
   '["unlimited","sms","portfolio","ai","api","retailer_analytics","all_future_features"]')
on conflict (id) do update set
  max_watchlist_items = 999999,
  max_collection_items = 999999,
  sms_alerts = true,
  portfolio_tracking = true,
  historical_pricing = true,
  investment_tools = true,
  ai_insights = true,
  priority_alerts = true,
  api_access = true;

-- Invite codes table
create table if not exists public.invite_codes (
  id              uuid primary key default uuid_generate_v4(),
  code            text not null unique,
  label           text,
  grants_tier     text not null default 'premium'
    check (grants_tier in ('premium','enterprise','founder')),
  grants_duration_days  int,
  max_uses        int not null default 1,
  use_count       int not null default 0,
  is_active       boolean not null default true,
  created_by      uuid references auth.users(id),
  expires_at      timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.invite_codes enable row level security;
create policy "Admin manages invite_codes" on public.invite_codes for all using (
  exists(select 1 from public.profiles where id = auth.uid()
    and role in ('admin','super_admin'))
);
create policy "Anyone can redeem codes" on public.invite_codes
  for select using (is_active = true);

-- Invite redemptions
create table if not exists public.invite_redemptions (
  id          uuid primary key default uuid_generate_v4(),
  code_id     uuid not null references public.invite_codes(id),
  user_id     uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique(code_id, user_id)
);
alter table public.invite_redemptions enable row level security;
create policy "Users see own redemptions" on public.invite_redemptions
  for select using (auth.uid() = user_id);
create policy "Service insert redemptions" on public.invite_redemptions
  for insert with check (true);

-- Check if user has founder / admin privileges
create or replace function public.is_privileged_user(p_user_id uuid default auth.uid())
returns boolean language plpgsql security definer as $$
begin
  return exists(
    select 1 from public.profiles
    where id = p_user_id
      and (role in ('admin','super_admin') or subscription_tier = 'founder')
  );
end;$$;

-- Redeem an invite code
create or replace function public.redeem_invite_code(p_code text, p_user_id uuid default auth.uid())
returns jsonb language plpgsql security definer as $$
declare
  v_code  public.invite_codes%rowtype;
  v_ends  timestamptz;
begin
  select * into v_code from public.invite_codes
  where upper(trim(code)) = upper(trim(p_code))
    and is_active = true
    and (expires_at is null or expires_at > now())
    and (max_uses = 0 or use_count < max_uses);

  if not found then
    return jsonb_build_object('success', false, 'error', 'Invalid or expired invite code');
  end if;

  if exists(select 1 from public.invite_redemptions
            where code_id = v_code.id and user_id = p_user_id) then
    return jsonb_build_object('success', false, 'error', 'You have already used this code');
  end if;

  if v_code.grants_duration_days is not null then
    v_ends := now() + (v_code.grants_duration_days || ' days')::interval;
  end if;

  update public.profiles set
    subscription_tier    = v_code.grants_tier,
    subscription_status  = 'active',
    subscription_ends_at = v_ends
  where id = p_user_id;

  insert into public.invite_redemptions (code_id, user_id)
  values (v_code.id, p_user_id);

  update public.invite_codes set use_count = use_count + 1 where id = v_code.id;

  return jsonb_build_object(
    'success', true, 'tier', v_code.grants_tier, 'expires_at', v_ends
  );
end;$$;

-- Admin grant access helper
create or replace function public.admin_grant_access(
  p_target_email text, p_tier text, p_days int default null
) returns jsonb language plpgsql security definer as $$
declare v_ends timestamptz;
begin
  if not public.is_privileged_user() then
    return jsonb_build_object('success', false, 'error', 'Permission denied');
  end if;
  if p_days is not null then
    v_ends := now() + (p_days || ' days')::interval;
  end if;
  update public.profiles set
    subscription_tier    = p_tier,
    subscription_status  = 'active',
    subscription_ends_at = v_ends
  where email = p_target_email;
  if not found then
    return jsonb_build_object('success', false, 'error', 'User not found');
  end if;
  return jsonb_build_object('success', true, 'tier', p_tier, 'expires_at', v_ends);
end;$$;
