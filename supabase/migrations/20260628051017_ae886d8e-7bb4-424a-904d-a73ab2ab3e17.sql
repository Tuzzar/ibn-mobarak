
CREATE TABLE public.home_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL DEFAULT '',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.home_sections TO anon;
GRANT SELECT ON public.home_sections TO authenticated;
GRANT ALL ON public.home_sections TO service_role;

ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible sections"
  ON public.home_sections FOR SELECT
  USING (is_visible = true OR public.has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can insert sections"
  ON public.home_sections FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can update sections"
  ON public.home_sections FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'administrator'::app_role));

CREATE POLICY "Administrators can delete sections"
  ON public.home_sections FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::app_role));

CREATE INDEX home_sections_position_idx ON public.home_sections (position);

CREATE TRIGGER home_sections_updated_at
  BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
