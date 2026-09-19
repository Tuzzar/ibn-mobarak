
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'suspended'));

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('administrator'::app_role, 'admin'::app_role, 'moderator'::app_role)
      AND status = 'active'
  );
$$;

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Administrators manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'administrator'))
  WITH CHECK (public.has_role(auth.uid(), 'administrator'));

DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins view orders" ON public.orders;
CREATE POLICY "Staff view orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins view order history" ON public.order_history;
DROP POLICY IF EXISTS "Admins insert order history" ON public.order_history;
CREATE POLICY "Staff view order history" ON public.order_history
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff insert order history" ON public.order_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND changed_by = auth.uid());

DROP POLICY IF EXISTS "Admins delete products" ON public.products;
DROP POLICY IF EXISTS "Admins insert products" ON public.products;
DROP POLICY IF EXISTS "Admins update products" ON public.products;
CREATE POLICY "Staff insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff update products" ON public.products
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Administrators delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'administrator'));
