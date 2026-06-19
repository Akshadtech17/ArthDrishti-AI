-- analyses: stores every AI-generated business analysis
create table if not exists public.analyses (
  id uuid default gen_random_uuid() primary key,
  query text not null,
  business_name text not null,
  industry text,
  analysis_data jsonb not null,
  view_count integer default 1,
  created_at timestamptz default now()
);

-- business_of_the_day: one featured business per calendar day
create table if not exists public.business_of_the_day (
  id uuid default gen_random_uuid() primary key,
  business_name text not null,
  analysis_data jsonb not null,
  featured_date date default current_date,
  created_at timestamptz default now(),
  unique (featured_date)
);

-- Enable RLS on both tables
alter table public.analyses enable row level security;
alter table public.business_of_the_day enable row level security;

-- Public read + write (no auth phase)
create policy "allow_all_analyses" on public.analyses
  for all using (true) with check (true);

create policy "allow_all_botd" on public.business_of_the_day
  for all using (true) with check (true);

-- Atomic view-count increment to avoid race conditions
create or replace function public.increment_view_count(analysis_id uuid)
returns void
language sql
security definer
as $$
  update public.analyses set view_count = view_count + 1 where id = analysis_id;
$$;
