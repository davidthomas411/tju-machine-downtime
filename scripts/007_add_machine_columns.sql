-- Ensure machines table has optional fields used by the app
alter table public.machines
  add column if not exists model text;

alter table public.machines
  add column if not exists location text;

alter table public.machines
  add column if not exists display_order integer default 0;

alter table public.machines
  add column if not exists is_active boolean default true;
