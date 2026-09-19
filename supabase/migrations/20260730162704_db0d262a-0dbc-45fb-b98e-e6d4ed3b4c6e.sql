-- 1. Lock down SECURITY DEFINER helper functions
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- Trigger-only functions must not be callable via the API at all
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_order_totals() FROM PUBLIC, anon, authenticated;

-- 2. home_sections: split policy so anonymous reads never call has_role()
DROP POLICY IF EXISTS "Public can view visible sections" ON public.home_sections;
CREATE POLICY "Anon can view visible sections"
  ON public.home_sections FOR SELECT TO anon
  USING (is_visible = true);
CREATE POLICY "Users can view visible sections"
  ON public.home_sections FOR SELECT TO authenticated
  USING (is_visible = true OR public.has_role(auth.uid(), 'administrator'::public.app_role));

-- 3. incomplete_orders: explicitly deny all anon access (PII)
REVOKE ALL ON public.incomplete_orders FROM anon;
GRANT SELECT, UPDATE, DELETE ON public.incomplete_orders TO authenticated;
GRANT ALL ON public.incomplete_orders TO service_role;

-- 4. site_content: public reads limited to non-secret keys
DROP POLICY IF EXISTS "Site content is public" ON public.site_content;
CREATE POLICY "Public can read display site content"
  ON public.site_content FOR SELECT TO anon, authenticated
  USING (
    key !~* '(key|secret|token|password|passwd|credential|api|private|webhook)'
  );
CREATE POLICY "Staff can read all site content"
  ON public.site_content FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));