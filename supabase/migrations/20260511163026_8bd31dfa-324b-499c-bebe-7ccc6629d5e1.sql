
-- Fix function search path warnings
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Restrict has_role execution (RLS still works as it runs with table owner privileges)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

-- Remove broad listing on product-images; public bucket still serves files via direct URL
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
