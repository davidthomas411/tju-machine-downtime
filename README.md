# TJU LINAC Machine Status Dashboard

Modern Next.js dashboard for Thomas Jefferson University Radiation Oncology LINAC status tracking.
This version uses Supabase Auth + Postgres for persistence and real-time updates.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` (dashboard) or `http://localhost:3000/display` (large screen display).

## Supabase setup

1) Create a Supabase project.
2) Run the schema SQL in `scripts/001_create_linac_tables.sql`.
3) Run the analytics SQL in `scripts/002_create_status_history.sql` (for statistics).
4) Run the network SQL in `scripts/003_add_site_network.sql` (for multi-network sites).
5) Run the notes column SQL in `scripts/004_add_machine_status_notes.sql` (if you see schema cache errors).
6) Run the machine status audit SQL in `scripts/006_add_machine_status_columns.sql` (if you see missing updated_at/updated_by errors).
7) Run the machine columns SQL in `scripts/007_add_machine_columns.sql` (if machine edits fail due to missing columns).
8) Run the machine status unique SQL in `scripts/008_add_machine_status_unique.sql` (if you see ON CONFLICT errors).
6) Add environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_BOOTSTRAP_CODE=...
```

Create an admin user in Supabase Auth (email + password), then set their role:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@tju.local';
```

### Admin bootstrap (in-app)
If you prefer not to use SQL, set `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_BOOTSTRAP_CODE`.
Log in, then use the **Admin setup** card on the dashboard to claim admin access.
This only works when no admins exist yet.

### Username-only login (no emails)
The login screen accepts a **username** and appends `@tju.local` automatically.
Create users in Supabase with emails like `admin@tju.local` and password `admin`.
New signups default to the `staff` role so they can update machine status; change to `viewer` for read-only.
You can override the domain with:

```
NEXT_PUBLIC_AUTH_DOMAIN=tju.local
```

Optionally assign them to the default site:

```sql
update public.profiles
set site_id = '00000000-0000-0000-0000-000000000001'
where email = 'admin@tju.local';
```

## Display mode

Use `/display` for the wallboard view. It rotates widgets and refreshes via Supabase Realtime.

## Weather (Open-Meteo)

The display pulls live weather from Open-Meteo (no API key required). Configure:

```
WEATHER_LAT=39.9526
WEATHER_LON=-75.1652
WEATHER_LOCATION_NAME=Philadelphia, PA
```

## Next steps

- Add live webcam feeds
- Add announcements editor and site settings UI
