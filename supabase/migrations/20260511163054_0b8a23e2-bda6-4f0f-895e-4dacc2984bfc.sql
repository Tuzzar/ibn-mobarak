
DROP POLICY IF EXISTS "Anyone can place order" ON public.orders;
CREATE POLICY "Guests can place valid order" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    total > 0
    AND subtotal > 0
    AND length(customer_name) > 0
    AND length(customer_phone) > 0
    AND length(address) > 0
    AND jsonb_typeof(items) = 'array'
    AND jsonb_array_length(items) > 0
    AND jsonb_array_length(items) <= 100
  );
