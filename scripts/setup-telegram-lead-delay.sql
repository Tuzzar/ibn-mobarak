-- Telegram lead alert delay — run this ONCE in your external Supabase SQL editor.
-- (Project: ayxnpifkrqohygyureqg)

-- 1) Schema: queue fields for delayed "incomplete order" alerts
ALTER TABLE public.incomplete_orders
  ADD COLUMN IF NOT EXISTS notify_after timestamptz,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

CREATE INDEX IF NOT EXISTS incomplete_orders_pending_notify_idx
  ON public.incomplete_orders (notify_after)
  WHERE notified_at IS NULL AND status = 'new';

CREATE INDEX IF NOT EXISTS incomplete_orders_phone_idx
  ON public.incomplete_orders (customer_phone);

-- Old rows should never fire a late alert
UPDATE public.incomplete_orders
   SET notified_at = now()
 WHERE notified_at IS NULL AND notify_after IS NULL;

-- 2) Default delay (minutes) — change 2 to whatever you like, or edit it in Admin
INSERT INTO public.app_settings (key, value)
VALUES ('telegram_lead_delay_minutes', '2')
ON CONFLICT (key) DO NOTHING;

-- 3) Cron: flush due lead alerts every minute
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('flush-telegram-leads')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'flush-telegram-leads');

SELECT cron.schedule(
  'flush-telegram-leads',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://almiftah.lovable.app/api/public/telegram/flush-leads',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Replace the url above with your live site domain if you serve from Cloudflare,
-- e.g. https://yourdomain.com/api/public/telegram/flush-leads
