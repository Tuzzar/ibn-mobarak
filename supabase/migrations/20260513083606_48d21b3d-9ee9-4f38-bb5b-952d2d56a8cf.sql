ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: seed images array from existing image_url so nothing is lost
UPDATE public.products
SET images = jsonb_build_array(image_url)
WHERE (images IS NULL OR images = '[]'::jsonb) AND image_url IS NOT NULL;