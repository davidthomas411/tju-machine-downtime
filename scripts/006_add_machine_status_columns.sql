-- Ensure machine_statuses includes audit columns used by the app
alter table public.machine_statuses
  add column if not exists notes text;

alter table public.machine_statuses
  add column if not exists updated_by uuid references auth.users(id);

alter table public.machine_statuses
  add column if not exists updated_at timestamp with time zone default now();
