-- Add network field to sites for system-level grouping
alter table public.sites
  add column if not exists network text default 'tju';

update public.sites
set network = 'tju'
where network is null;
