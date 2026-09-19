-- Run this in the EXTERNAL Supabase project (vdbkannwrsekvrdwijrx)
-- SQL Editor → New query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE where possible).

create table if not exists public.site_content (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  value      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Public read
drop policy if exists "Site content is public" on public.site_content;
create policy "Site content is public"
  on public.site_content for select
  to public using (true);

-- Staff write (relies on existing public.is_staff(uuid))
drop policy if exists "Staff insert site content" on public.site_content;
create policy "Staff insert site content"
  on public.site_content for insert
  to authenticated
  with check (public.is_staff(auth.uid()));

drop policy if exists "Staff update site content" on public.site_content;
create policy "Staff update site content"
  on public.site_content for update
  to authenticated
  using (public.is_staff(auth.uid()))
  with check (public.is_staff(auth.uid()));

-- updated_at trigger (relies on existing public.update_updated_at())
drop trigger if exists update_site_content_updated_at on public.site_content;
create trigger update_site_content_updated_at
  before update on public.site_content
  for each row execute function public.update_updated_at();
