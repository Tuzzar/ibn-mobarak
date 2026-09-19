-- ============================================================
-- Al Miftah Shop — full schema for the external Supabase project
-- Run this ONCE in: your Supabase project -> SQL Editor -> New query
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE where possible).
-- ============================================================

-- ---------- 1. Enum ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'administrator', 'moderator');
  END IF;
END
$$;

-- ---------- 2. Shared helper: updated_at ----------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============================================================
-- 3. user_roles  (role storage — never store roles on profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Administrators manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- ---------- 4. Security-definer role helpers (prevent RLS recursion) ----------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('administrator'::public.app_role, 'admin'::public.app_role, 'moderator'::public.app_role)
      AND status = 'active'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;

CREATE POLICY "Administrators manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.has_role(auth.uid(), 'administrator'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  category text,
  unit text DEFAULT 'kg'::text,
  featured boolean NOT NULL DEFAULT false,
  product_level text NOT NULL DEFAULT 'F' CHECK (product_level IN ('A','B','C','D','E','F')),
  sort_order integer NOT NULL DEFAULT 0,
  weight_variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  discount_amount integer NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_level_sort_idx ON public.products (product_level, sort_order);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are public" ON public.products;
CREATE POLICY "Products are public" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff insert products" ON public.products;
CREATE POLICY "Staff insert products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff update products" ON public.products;
CREATE POLICY "Staff update products" ON public.products FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Administrators delete products" ON public.products;
CREATE POLICY "Administrators delete products" ON public.products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'));

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 6. menu_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  label text NOT NULL,
  slug text NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_parent_sort ON public.menu_categories (parent_id, sort_order);

GRANT SELECT ON public.menu_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_categories TO authenticated;
GRANT ALL ON public.menu_categories TO service_role;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active menu categories" ON public.menu_categories;
CREATE POLICY "Public can read active menu categories" ON public.menu_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff can insert menu categories" ON public.menu_categories;
CREATE POLICY "Staff can insert menu categories" ON public.menu_categories FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can update menu categories" ON public.menu_categories;
CREATE POLICY "Staff can update menu categories" ON public.menu_categories FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can delete menu categories" ON public.menu_categories;
CREATE POLICY "Staff can delete menu categories" ON public.menu_categories FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS trg_menu_categories_updated_at ON public.menu_categories;
CREATE TRIGGER trg_menu_categories_updated_at BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 7. orders  (+ order number sequence + totals validation)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.orders_order_no_seq;

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no integer DEFAULT nextval('public.orders_order_no_seq'),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  address text NOT NULL,
  city text NOT NULL,
  notes text,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  delivery_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'web',
  courier_consignment_id text,
  courier_tracking_code text,
  courier_status text,
  courier_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_courier_consignment_id_key
  ON public.orders (courier_consignment_id) WHERE courier_consignment_id IS NOT NULL;

GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.orders_order_no_seq TO anon, authenticated, service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests can place valid order" ON public.orders;
CREATE POLICY "Guests can place valid order" ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (
    total > 0 AND subtotal > 0
    AND length(customer_name) > 0
    AND length(customer_phone) > 0
    AND length(address) > 0
    AND jsonb_typeof(items) = 'array'
    AND jsonb_array_length(items) > 0
    AND jsonb_array_length(items) <= 100
  );
DROP POLICY IF EXISTS "Staff view orders" ON public.orders;
CREATE POLICY "Staff view orders" ON public.orders FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff update orders" ON public.orders;
CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Administrators delete orders" ON public.orders;
CREATE POLICY "Administrators delete orders" ON public.orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'));

CREATE OR REPLACE FUNCTION public.validate_order_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  item jsonb;
  pid uuid;
  qty numeric;
  unit_price numeric;
  expected_subtotal numeric := 0;
  expected_total numeric;
BEGIN
  IF NEW.delivery_fee NOT IN (0, 70, 130) THEN
    RAISE EXCEPTION 'Invalid delivery fee: %', NEW.delivery_fee;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    BEGIN
      pid := (item->>'id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Invalid product id in order item';
    END;

    qty := COALESCE((item->>'quantity')::numeric, 0);
    IF qty <= 0 OR qty > 1000 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', pid;
    END IF;

    SELECT price INTO unit_price FROM public.products WHERE id = pid;
    IF unit_price IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', pid;
    END IF;

    expected_subtotal := expected_subtotal + (unit_price * qty);
  END LOOP;

  expected_subtotal := round(expected_subtotal, 2);
  expected_total := round(expected_subtotal + NEW.delivery_fee, 2);

  IF abs(NEW.subtotal - expected_subtotal) > 0.01 THEN
    RAISE EXCEPTION 'Subtotal mismatch. Expected %, got %', expected_subtotal, NEW.subtotal;
  END IF;

  IF abs(NEW.total - expected_total) > 0.01 THEN
    RAISE EXCEPTION 'Total mismatch. Expected %, got %', expected_total, NEW.total;
  END IF;

  NEW.subtotal := expected_subtotal;
  NEW.total := expected_total;

  RETURN NEW;
END;
$$;

-- NOTE: only ONE validation trigger here (the old project had a duplicate).
DROP TRIGGER IF EXISTS orders_validate_totals ON public.orders;
DROP TRIGGER IF EXISTS validate_order_totals_trigger ON public.orders;
CREATE TRIGGER orders_validate_totals BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_totals();

-- ============================================================
-- 8. order_history  (immutable audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid NOT NULL,
  changed_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON public.order_history (order_id, created_at DESC);

GRANT SELECT, INSERT ON public.order_history TO authenticated;
GRANT ALL ON public.order_history TO service_role;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view order history" ON public.order_history;
CREATE POLICY "Staff view order history" ON public.order_history FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff insert order history" ON public.order_history;
CREATE POLICY "Staff insert order history" ON public.order_history FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND changed_by = auth.uid());

-- ============================================================
-- 9. incomplete_orders  (guest leads — inserted only via server code)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.incomplete_orders (
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

CREATE INDEX IF NOT EXISTS incomplete_orders_status_created_idx
  ON public.incomplete_orders (status, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.incomplete_orders TO authenticated;
GRANT ALL ON public.incomplete_orders TO service_role;
ALTER TABLE public.incomplete_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Staff view incomplete orders" ON public.incomplete_orders FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff update incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Staff update incomplete orders" ON public.incomplete_orders FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Administrators delete incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Administrators delete incomplete orders" ON public.incomplete_orders FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS incomplete_orders_updated_at ON public.incomplete_orders;
CREATE TRIGGER incomplete_orders_updated_at BEFORE UPDATE ON public.incomplete_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 10. site_content  (public keys readable; secrets staff-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read display site content" ON public.site_content;
CREATE POLICY "Public can read display site content" ON public.site_content FOR SELECT TO anon, authenticated
  USING (key !~* '(key|secret|token|password|passwd|credential|api|private|webhook)');
DROP POLICY IF EXISTS "Staff can read all site content" ON public.site_content;
CREATE POLICY "Staff can read all site content" ON public.site_content FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff insert site content" ON public.site_content;
CREATE POLICY "Staff insert site content" ON public.site_content FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff update site content" ON public.site_content;
CREATE POLICY "Staff update site content" ON public.site_content FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS site_content_updated_at ON public.site_content;
CREATE TRIGGER site_content_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 11. home_sections
-- ============================================================
CREATE TABLE IF NOT EXISTS public.home_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL DEFAULT '',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS home_sections_position_idx ON public.home_sections ("position");

GRANT SELECT ON public.home_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_sections TO authenticated;
GRANT ALL ON public.home_sections TO service_role;
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon can view visible sections" ON public.home_sections;
CREATE POLICY "Anon can view visible sections" ON public.home_sections FOR SELECT TO anon
  USING (is_visible = true);
DROP POLICY IF EXISTS "Users can view visible sections" ON public.home_sections;
CREATE POLICY "Users can view visible sections" ON public.home_sections FOR SELECT TO authenticated
  USING (is_visible = true OR public.has_role(auth.uid(), 'administrator'));
DROP POLICY IF EXISTS "Administrators can insert sections" ON public.home_sections;
CREATE POLICY "Administrators can insert sections" ON public.home_sections FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator'));
DROP POLICY IF EXISTS "Administrators can update sections" ON public.home_sections;
CREATE POLICY "Administrators can update sections" ON public.home_sections FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator')) WITH CHECK (public.has_role(auth.uid(), 'administrator'));
DROP POLICY IF EXISTS "Administrators can delete sections" ON public.home_sections;
CREATE POLICY "Administrators can delete sections" ON public.home_sections FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'));

DROP TRIGGER IF EXISTS home_sections_updated_at ON public.home_sections;
CREATE TRIGGER home_sections_updated_at BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 12. landing_pages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  product_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  hero_headline text NOT NULL DEFAULT '',
  hero_subheadline text NOT NULL DEFAULT '',
  hero_image_url text,
  offer_text text,
  urgency_text text,
  discount_amount integer,
  discount_percent integer,
  free_delivery boolean NOT NULL DEFAULT true,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  testimonial_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_button_text text NOT NULL DEFAULT 'অর্ডার করুন',
  cta_phone text,
  seo_title text,
  seo_description text,
  og_image_url text,
  meta_pixel_id text,
  review_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_url text,
  video_urls text,
  video_label text,
  video_heading text,
  video_description text,
  hero_bullets jsonb,
  hero_badge_top text,
  hero_badge_bottom text,
  trust_strip jsonb,
  testimonials_kicker text,
  testimonials_title text,
  features_kicker text,
  features_title text,
  amrapali_kicker text,
  amrapali_title text,
  amrapali_points jsonb,
  promise_kicker text,
  promise_title text,
  promise_items jsonb,
  journey_kicker text,
  journey_title text,
  journey_steps jsonb,
  stats_kicker text,
  stats_title text,
  stats_items jsonb,
  faq_kicker text,
  faq_title text,
  final_cta_kicker text,
  final_cta_title text,
  final_cta_description text,
  quantity_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.landing_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.landing_pages TO authenticated;
GRANT ALL ON public.landing_pages TO service_role;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read landing pages" ON public.landing_pages;
CREATE POLICY "Public can read landing pages" ON public.landing_pages FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS "Staff can insert landing pages" ON public.landing_pages;
CREATE POLICY "Staff can insert landing pages" ON public.landing_pages FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can update landing pages" ON public.landing_pages;
CREATE POLICY "Staff can update landing pages" ON public.landing_pages FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can delete landing pages" ON public.landing_pages;
CREATE POLICY "Staff can delete landing pages" ON public.landing_pages FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS update_landing_pages_updated_at ON public.landing_pages;
CREATE TRIGGER update_landing_pages_updated_at BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 13. courier_checks  (fraud-check cache)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courier_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  total_parcel integer NOT NULL DEFAULT 0,
  delivered integer NOT NULL DEFAULT 0,
  cancelled integer NOT NULL DEFAULT 0,
  success_rate numeric NOT NULL DEFAULT 0,
  bdcourier_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  steadfast_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS courier_checks_phone_idx ON public.courier_checks (phone);

GRANT SELECT ON public.courier_checks TO authenticated;
GRANT ALL ON public.courier_checks TO service_role;
ALTER TABLE public.courier_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read courier checks" ON public.courier_checks;
CREATE POLICY "Staff read courier checks" ON public.courier_checks FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS courier_checks_updated_at ON public.courier_checks;
CREATE TRIGGER courier_checks_updated_at BEFORE UPDATE ON public.courier_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 14. app_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read app settings" ON public.app_settings;
CREATE POLICY "Staff read app settings" ON public.app_settings FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

DROP TRIGGER IF EXISTS app_settings_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 15. Storage bucket for product images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Product images are publicly readable" ON storage.objects;
CREATE POLICY "Product images are publicly readable" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Staff upload product images" ON storage.objects;
CREATE POLICY "Staff upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff update product images" ON storage.objects;
CREATE POLICY "Staff update product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff delete product images" ON storage.objects;
CREATE POLICY "Staff delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_staff(auth.uid()));

-- ============================================================
-- DONE. Next: the data copy + admin account are handled from Lovable.
-- ============================================================
