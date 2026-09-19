ALTER TABLE public.incomplete_orders
  ADD COLUMN IF NOT EXISTS notify_after timestamptz,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

CREATE INDEX IF NOT EXISTS incomplete_orders_pending_notify_idx
  ON public.incomplete_orders (notify_after)
  WHERE notified_at IS NULL AND status = 'new';

CREATE INDEX IF NOT EXISTS incomplete_orders_phone_idx
  ON public.incomplete_orders (customer_phone);