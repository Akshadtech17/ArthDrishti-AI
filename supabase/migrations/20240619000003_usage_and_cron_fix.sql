-- Server-side rate limiting table
create table if not exists public.daily_usage (
  user_id  text not null,
  date     date not null default current_date,
  count    integer not null default 0,
  primary key (user_id, date)
);

alter table public.daily_usage enable row level security;

create policy "Service role manages daily_usage"
  on public.daily_usage for all
  using (true)
  with check (true);

-- Atomic check-and-increment: prevents race conditions under concurrent requests
create or replace function public.increment_daily_usage(
  p_user_id text,
  p_date    date,
  p_limit   integer
) returns jsonb language plpgsql security definer as $$
declare
  v_count integer;
begin
  insert into public.daily_usage (user_id, date, count)
  values (p_user_id, p_date, 0)
  on conflict (user_id, date) do nothing;

  select count into v_count
  from public.daily_usage
  where user_id = p_user_id and date = p_date
  for update;

  if v_count >= p_limit then
    return jsonb_build_object('allowed', false, 'count', v_count, 'remaining', 0);
  end if;

  update public.daily_usage
  set count = count + 1
  where user_id = p_user_id and date = p_date;

  return jsonb_build_object(
    'allowed',   true,
    'count',     v_count + 1,
    'remaining', p_limit - v_count - 1
  );
end;
$$;

-- Fix BOTD cron: reschedule with proper Authorization header so the edge function accepts the call
select cron.unschedule('generate-botd-daily');

select cron.schedule(
  'generate-botd-daily',
  '1 0 * * *',
  $job$
  select net.http_post(
    url     := 'https://nttrsltuequkgotwonpt.supabase.co/functions/v1/generate-botd',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dHJzbHR1ZXF1a2dvdHdvbnB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NjIzNDUsImV4cCI6MjA5NzQzODM0NX0.vxe7GofY1HVBH6FI8NdGvqk_0E7J8UAqnLemIHtsTNY'
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) as request_id;
  $job$
);
