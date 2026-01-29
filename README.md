# TJU LINAC Machine Status Dashboard

Modern Next.js dashboard for Thomas Jefferson University Radiation Oncology LINAC status tracking.
This version uses local JSON storage and browser Basic Auth so we can iterate quickly.

## Quick start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` (dashboard) or `http://localhost:3000/display` (large screen display).

## Basic Auth (current login)

Default credentials are:

- `admin` / `admin` (admin role)
- `user1` / `user1` (staff role)

Override with `BASIC_AUTH_USERS` in `.env.local`:

```
BASIC_AUTH_USERS=admin:admin:admin:Admin User:admin@jefferson.edu,user1:user1:staff:Staff User:user1@jefferson.edu
```

Format: `username:password:role:full name:email` (comma-separated entries). Role can be `admin`, `staff`, or `viewer`.

## Data storage

We keep data in `data/store.json` for now:

- `sites` and `machines` control the dashboard grid
- `machine_statuses` stores the latest status per machine
- `users` maps Basic Auth usernames to roles and site permissions

When you add machines or sites in the Admin panel, the JSON is updated automatically.

## Display mode

Use `/display` for the wallboard view. It rotates widgets and refreshes via server-sent events.

## Next steps

- Replace JSON storage with Supabase/Postgres when ready
- Add real weather + webcam feeds
- Add announcements editor and site settings UI
