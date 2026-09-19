CREATE TABLE public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  product_id uuid,
  is_active boolean not null default true,
  hero_headline text not null default '',
  hero_subheadline text not null default '',
  hero_image_url text,
  offer_text text,
  urgency_text text,
  discount_amount int,
  discount_percent int,
  free_delivery boolean not null default true,
  features jsonb not null default '[]'::jsonb,
  testimonial_ids jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  cta_button_text text not null default 'অর্ডার করুন',
  cta_phone text,
  seo_title text,
  seo_description text,
  og_image_url text,
  meta_pixel_id text,
  review_images jsonb not null default '[]'::jsonb,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.landing_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.landing_pages TO authenticated;
GRANT ALL ON public.landing_pages TO service_role;

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read landing pages"
  ON public.landing_pages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can insert landing pages"
  ON public.landing_pages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update landing pages"
  ON public.landing_pages FOR UPDATE
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete landing pages"
  ON public.landing_pages FOR DELETE
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();