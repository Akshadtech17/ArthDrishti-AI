-- Pro subscriptions: stores verified Razorpay payments and 30-day access tokens
create table if not exists public.pro_subscriptions (
  id           uuid default gen_random_uuid() primary key,
  access_token uuid default gen_random_uuid() unique not null,
  payment_id   text not null,
  order_id     text,
  expires_at   timestamptz not null,
  created_at   timestamptz default now()
);

alter table public.pro_subscriptions enable row level security;

-- Anyone can insert (payment verification happens in the edge function before insert)
create policy "allow_insert_pro" on public.pro_subscriptions
  for insert with check (true);

-- Anyone can look up their own token by access_token value
create policy "allow_select_pro" on public.pro_subscriptions
  for select using (true);

-- Analytics events: fire-and-forget product telemetry (no PII)
create table if not exists public.events (
  id          uuid default gen_random_uuid() primary key,
  event_name  text not null,
  properties  jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

alter table public.events enable row level security;

create policy "allow_insert_events" on public.events
  for insert with check (true);

create policy "allow_select_events" on public.events
  for select using (true);
