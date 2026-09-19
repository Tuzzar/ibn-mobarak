CREATE TABLE public.incomplete_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text NOT NULL UNIQUE,
  customer_name text NOT NULL DEFAULT '',
  customer_phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  notes text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'checkout',
  landing_slug text,
  product_id uuid,
  status text NOT NULL DEFAULT 'new',
  admin_note text,
  converted_order_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.incomplete_orders TO authenticated;
GRANT ALL ON public.incomplete_orders TO service_role;

ALTER TABLE public.incomplete_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view incomplete orders" ON public.incomplete_orders
  FOR SELECT TO authenticated USING (is_staff(auth.uid()));

CREATE POLICY "Staff update incomplete orders" ON public.incomplete_orders
  FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Administrators delete incomplete orders" ON public.incomplete_orders
  FOR DELETE TO authenticated USING (is_staff(auth.uid()));

CREATE INDEX incomplete_orders_status_created_idx ON public.incomplete_orders (status, created_at DESC);

CREATE TRIGGER incomplete_orders_updated_at
  BEFORE UPDATE ON public.incomplete_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();