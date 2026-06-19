-- Enable pg_cron and pg_net extensions (already available on Supabase)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the generate-botd edge function to run at 00:01 UTC every day
-- This pre-generates the Business of the Day so the first visitor never waits.
-- 00:01 UTC = 05:31 AM IST
select cron.schedule(
  'generate-botd-daily',
  '1 0 * * *',
  $$
  select net.http_post(
    url        := 'https://nttrsltuequkgotwonpt.supabase.co/functions/v1/generate-botd',
    headers    := '{"Content-Type": "application/json"}'::jsonb,
    body       := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) as request_id;
  $$
);
