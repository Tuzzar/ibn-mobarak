-- ================================================================
-- Fulbanu — Initial schema for NEW Supabase project (kwjtenmrkpntvwwkpicr)
-- Run this ONCE in Supabase Dashboard → SQL Editor → New Query → Run
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- ================================================================

-- 1. ENUM: app_role
do $$ begin
  create type public.app_role as enum ('administrator', 'admin', 'moderator');
exception when duplicate_object then null; end $$;

-- 2. updated_at trigger function
create or replace function public.update_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ================================================================
-- 3. user_roles (auth + role)
-- ================================================================
create table if not exists public.user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       public.app_role not null,
  status     text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

drop policy if exists "Users can view their own roles" on public.user_roles;
create policy "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

-- has_role + is_staff (SECURITY DEFINER — prevents RLS recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role and status = 'active'
  );
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role in ('administrator','admin','moderator')
      and status = 'active'
  );
$$;

-- Administrators can manage all roles
drop policy if exists "Administrators manage roles" on public.user_roles;
create policy "Administrators manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'administrator'))
  with check (public.has_role(auth.uid(), 'administrator'));

-- ================================================================
-- 4. products
-- ================================================================
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  description     text,
  price           numeric(10,2) not null default 0,
  discount_amount numeric(10,2) default 0,
  image_url       text,
  images          jsonb default '[]'::jsonb,
  unit            text,
  category        text,
  featured        boolean not null default false,
  stock           integer not null default 0,
  product_level   integer not null default 100,
  sort_order      integer not null default 100,
  weight_variants jsonb default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

grant select on public.products to anon, authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

drop policy if exists "Products are public" on public.products;
create policy "Products are public"
  on public.products for select to public using (true);

drop policy if exists "Staff manage products" on public.products;
create policy "Staff manage products"
  on public.products for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop trigger if exists update_products_updated_at on public.products;
create trigger update_products_updated_at before update on public.products
  for each row execute function public.update_updated_at();

-- ================================================================
-- 5. orders
-- ================================================================
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,
  customer_name     text not null,
  customer_phone    text not null,
  customer_email    text,
  shipping_address  text not null,
  city              text,
  items             jsonb not null default '[]'::jsonb,
  subtotal          numeric(10,2) not null default 0,
  shipping_cost     numeric(10,2) not null default 0,
  total             numeric(10,2) not null default 0,
  status            text not null default 'pending',
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

grant insert on public.orders to anon, authenticated;
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;

drop policy if exists "Anyone can create orders" on public.orders;
create policy "Anyone can create orders"
  on public.orders for insert to public with check (true);

drop policy if exists "Staff view orders" on public.orders;
create policy "Staff view orders"
  on public.orders for select to authenticated
  using (public.is_staff(auth.uid()));

drop policy if exists "Staff update orders" on public.orders;
create policy "Staff update orders"
  on public.orders for update to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop trigger if exists update_orders_updated_at on public.orders;
create trigger update_orders_updated_at before update on public.orders
  for each row execute function public.update_updated_at();

-- ================================================================
-- 6. order_history
-- ================================================================
create table if not exists public.order_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     text not null,
  note       text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select, insert on public.order_history to authenticated;
grant all on public.order_history to service_role;
alter table public.order_history enable row level security;

drop policy if exists "Staff view order history" on public.order_history;
create policy "Staff view order history"
  on public.order_history for select to authenticated
  using (public.is_staff(auth.uid()));

drop policy if exists "Staff insert order history" on public.order_history;
create policy "Staff insert order history"
  on public.order_history for insert to authenticated
  with check (public.is_staff(auth.uid()));

-- ================================================================
-- 7. site_content
-- ================================================================
create table if not exists public.site_content (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.site_content to anon, authenticated;
grant all on public.site_content to service_role;
alter table public.site_content enable row level security;

drop policy if exists "Site content is public" on public.site_content;
create policy "Site content is public"
  on public.site_content for select to public using (true);

drop policy if exists "Staff manage site content" on public.site_content;
create policy "Staff manage site content"
  on public.site_content for all to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

drop trigger if exists update_site_content_updated_at on public.site_content;
create trigger update_site_content_updated_at before update on public.site_content
  for each row execute function public.update_updated_at();

-- ================================================================
-- 8. Storage bucket: product-images (public)
-- ================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Product images are public" on storage.objects;
create policy "Product images are public"
  on storage.objects for select to public
  using (bucket_id = 'product-images');

drop policy if exists "Staff upload product images" on storage.objects;
create policy "Staff upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_staff(auth.uid()));

drop policy if exists "Staff update product images" on storage.objects;
create policy "Staff update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_staff(auth.uid()));

drop policy if exists "Staff delete product images" on storage.objects;
create policy "Staff delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_staff(auth.uid()));

-- ================================================================
-- DONE. Next: create your first user via Auth → Add user (email+password),
-- then run the follow-up SQL I'll give you to promote them to administrator.
-- ================================================================
