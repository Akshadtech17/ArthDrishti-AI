-- Link pro subscriptions to authenticated users for cross-device access
alter table public.pro_subscriptions
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_pro_subs_user_id
  on public.pro_subscriptions(user_id)
  where user_id is not null;
