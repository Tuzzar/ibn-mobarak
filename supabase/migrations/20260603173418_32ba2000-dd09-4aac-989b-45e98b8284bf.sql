ALTER TABLE public.products RENAME COLUMN discount_percent TO discount_amount;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_discount_percent_check;
ALTER TABLE public.products ADD CONSTRAINT products_discount_amount_check CHECK (discount_amount >= 0);