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
3) Add environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Create an admin user in Supabase Auth (email + password), then set their role:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@jefferson.edu';
```

Optionally assign them to the default site:

```sql
update public.profiles
set site_id = '00000000-0000-0000-0000-000000000001'
where email = 'admin@jefferson.edu';
```

## Display mode

Use `/display` for the wallboard view. It rotates widgets and refreshes via Supabase Realtime.

## Next steps

- Add real weather + webcam feeds
- Add announcements editor and site settings UI
