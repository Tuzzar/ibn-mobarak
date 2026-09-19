-- 1) Attach server-side order total validation trigger (function already exists)
DROP TRIGGER IF EXISTS validate_order_totals_trigger ON public.orders;
CREATE TRIGGER validate_order_totals_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_totals();

-- 2) Allow administrators to delete orders
DROP POLICY IF EXISTS "Administrators delete orders" ON public.orders;
CREATE POLICY "Administrators delete orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'::app_role));