-- 1) Order total validation trigger
CREATE OR REPLACE FUNCTION public.validate_order_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  pid uuid;
  qty numeric;
  unit_price numeric;
  expected_subtotal numeric := 0;
  expected_total numeric;
BEGIN
  -- Validate delivery fee against allowed zones
  IF NEW.delivery_fee NOT IN (0, 70, 130) THEN
    RAISE EXCEPTION 'Invalid delivery fee: %', NEW.delivery_fee;
  END IF;

  -- Recompute subtotal from real product prices
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

  -- Round to 2 decimals and allow 0.01 tolerance for float arithmetic
  expected_subtotal := round(expected_subtotal, 2);
  expected_total := round(expected_subtotal + NEW.delivery_fee, 2);

  IF abs(NEW.subtotal - expected_subtotal) > 0.01 THEN
    RAISE EXCEPTION 'Subtotal mismatch. Expected %, got %', expected_subtotal, NEW.subtotal;
  END IF;

  IF abs(NEW.total - expected_total) > 0.01 THEN
    RAISE EXCEPTION 'Total mismatch. Expected %, got %', expected_total, NEW.total;
  END IF;

  -- Normalize to canonical values
  NEW.subtotal := expected_subtotal;
  NEW.total := expected_total;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_validate_totals ON public.orders;
CREATE TRIGGER orders_validate_totals
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order_totals();

-- 2) Fix storage policies for product-images to use is_staff()
DROP POLICY IF EXISTS "Admins upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete product images" ON storage.objects;

CREATE POLICY "Staff upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'product-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.is_staff(auth.uid()));