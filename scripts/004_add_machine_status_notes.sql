-- Ensure machine_statuses has notes column (needed for status updates)
alter table public.machine_statuses
  add column if not exists notes text;
