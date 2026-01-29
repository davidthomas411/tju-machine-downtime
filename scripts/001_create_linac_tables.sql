-- Sites table for enterprise locations
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  address text,
  created_at timestamp with time zone default now()
);

-- Machines table for LINAC machines
create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  name text not null,
  model text,
  location text,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Machine status table for current status
create table if not exists public.machine_statuses (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null unique references public.machines(id) on delete cascade,
  status text not null default 'on_time', -- on_time, delayed_5min, delayed_10min, delayed_15min, delayed_30min, down_temporary, down_day, maintenance
  notes text,
  updated_by uuid references auth.users(id),
  updated_at timestamp with time zone default now()
);

-- User profiles with role management
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'viewer', -- admin, staff, viewer
  site_id uuid references public.sites(id),
  created_at timestamp with time zone default now()
);

-- Widget configuration for rotating display
create table if not exists public.widgets (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  type text not null, -- weather, webcam, announcement, clock
  title text,
  config jsonb default '{}'::jsonb,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Site settings for customization
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null unique references public.sites(id) on delete cascade,
  logo_url text,
  primary_color text default '#002B5C',
  secondary_color text default '#B3A369',
  rotation_interval integer default 30,
  display_mode text default 'grid',
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.sites enable row level security;
alter table public.machines enable row level security;
alter table public.machine_statuses enable row level security;
alter table public.profiles enable row level security;
alter table public.widgets enable row level security;
alter table public.site_settings enable row level security;

-- RLS Policies for sites
create policy "Anyone can view sites" on public.sites for select using (true);
create policy "Admins can insert sites" on public.sites for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update sites" on public.sites for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete sites" on public.sites for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- RLS Policies for machines
create policy "Anyone can view machines" on public.machines for select using (true);
create policy "Admins can insert machines" on public.machines for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update machines" on public.machines for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete machines" on public.machines for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- RLS Policies for machine_statuses
create policy "Anyone can view machine statuses" on public.machine_statuses for select using (true);
create policy "Staff and admins can insert statuses" on public.machine_statuses for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
);
create policy "Staff and admins can update statuses" on public.machine_statuses for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff'))
);

-- RLS Policies for profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Allow insert for authenticated users" on public.profiles for insert with check (auth.uid() = id);

-- RLS Policies for widgets
create policy "Anyone can view widgets" on public.widgets for select using (true);
create policy "Admins can manage widgets" on public.widgets for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- RLS Policies for site_settings
create policy "Anyone can view site settings" on public.site_settings for select using (true);
create policy "Admins can manage site settings" on public.site_settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Trigger to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'role', 'viewer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Insert default site and machines for TJU
insert into public.sites (id, name, code, address)
values (
  '00000000-0000-0000-0000-000000000001',
  'Thomas Jefferson University - Main Campus',
  'TJU-MAIN',
  '111 S 11th St, Philadelphia, PA 19107'
)
on conflict do nothing;

insert into public.site_settings (site_id, logo_url, primary_color, secondary_color, rotation_interval, display_mode)
values (
  '00000000-0000-0000-0000-000000000001',
  '/brand/Blue-TJU_logo.jpg',
  '#002B5C',
  '#B3A369',
  30,
  'grid'
)
on conflict do nothing;

-- Insert sample machines
insert into public.machines (site_id, name, model, location, display_order)
values
  ('00000000-0000-0000-0000-000000000001', 'LINAC 1', 'Varian TrueBeam', 'Vault A', 1),
  ('00000000-0000-0000-0000-000000000001', 'LINAC 2', 'Varian TrueBeam', 'Vault B', 2),
  ('00000000-0000-0000-0000-000000000001', 'LINAC 3', 'Elekta Versa HD', 'Vault C', 3),
  ('00000000-0000-0000-0000-000000000001', 'LINAC 4', 'Varian Halcyon', 'Vault D', 4)
on conflict do nothing;
