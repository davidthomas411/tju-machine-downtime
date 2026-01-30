-- Machine status history for analytics and reporting
create table if not exists public.machine_status_history (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.machines(id) on delete cascade,
  status text not null,
  notes text,
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

alter table public.machine_status_history enable row level security;

create policy "Anyone can view status history" on public.machine_status_history
  for select using (true);

create policy "Staff and admins can insert status history" on public.machine_status_history
  for insert with check (
    exists (
      select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')
    )
  );
