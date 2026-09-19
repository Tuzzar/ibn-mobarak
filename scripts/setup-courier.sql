-- ============================================================
-- Courier fraud / delivery-history system  (run ONCE in the
-- EXTERNAL Supabase project SQL editor)
-- ============================================================

-- 1) Encrypted-ish settings store for courier API credentials.
--    Staff-only read; only the service role (server functions) writes.
create table if not exists public.app_settings (
  key text primary key,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.app_settings to authenticated;
grant all on public.app_settings to service_role;

alter table public.app_settings enable row level security;

drop policy if exists "Staff read app settings" on public.app_settings;
create policy "Staff read app settings"
  on public.app_settings for select
  to authenticated
  using (public.is_staff(auth.uid()));

-- 2) Cached courier history per phone number.
create table if not exists public.courier_checks (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  total_parcel integer not null default 0,
  delivered integer not null default 0,
  cancelled integer not null default 0,
  success_rate numeric not null default 0,
  bdcourier_data jsonb not null default '{}'::jsonb,
  steadfast_data jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courier_checks_phone_idx on public.courier_checks (phone);

grant select on public.courier_checks to authenticated;
grant all on public.courier_checks to service_role;

alter table public.courier_checks enable row level security;

drop policy if exists "Staff read courier checks" on public.courier_checks;
create policy "Staff read courier checks"
  on public.courier_checks for select
  to authenticated
  using (public.is_staff(auth.uid()));

-- 3) updated_at triggers
drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.update_updated_at();

drop trigger if exists courier_checks_updated_at on public.courier_checks;
create trigger courier_checks_updated_at
  before update on public.courier_checks
  for each row execute function public.update_updated_at();
