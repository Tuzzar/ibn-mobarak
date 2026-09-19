ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'web';

CREATE SEQUENCE IF NOT EXISTS public.orders_order_no_seq;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_no integer;

-- Backfill existing rows in creation order
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC) AS rn
  FROM public.orders
  WHERE order_no IS NULL
)
UPDATE public.orders o SET order_no = n.rn FROM numbered n WHERE o.id = n.id;

SELECT setval('public.orders_order_no_seq', GREATEST((SELECT COALESCE(MAX(order_no), 0) FROM public.orders), 1));

ALTER TABLE public.orders ALTER COLUMN order_no SET DEFAULT nextval('public.orders_order_no_seq');

GRANT USAGE, SELECT ON SEQUENCE public.orders_order_no_seq TO anon, authenticated, service_role;