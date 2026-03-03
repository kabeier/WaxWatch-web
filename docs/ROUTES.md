# Routes

This app uses Next.js **App Router**.

## Project decision

- ✅ Decision: migrate to **Next.js App Router now** and treat `app/` as the canonical route tree.
- Keep `pages/api/*` for API routes only during this phase.

## Layout groups

Implemented structure:

- `app/(auth)/...` signed-out routes (login and account/session states)
- `app/(app)/...` authenticated shell routes
- `app/(app)/admin/...` optional admin routes (feature-flag + admin-claim gated)

## Route map

### MVP routes

- `/login` — Supabase auth UI / sign in flow
- `/search` — search listings + save search as alert
- `/alerts` — list alerts (watch rules)
- `/alerts/new` — create alert
- `/alerts/[id]` — alert detail/edit
- `/watchlist` — list/manage release watches
- `/notifications` — inbox + mark read/unread
- `/settings/profile` — profile + preferences
- `/settings/alerts` — alert delivery settings (quiet hours, frequency)
- `/settings/integrations` — Discogs connect/import/status
- `/settings/danger` — deactivate + hard delete

### Implemented but non-MVP support routes

- `/` — redirect to `/search`
- `/signed-out` — post-logout informational state
- `/account-removed` — post-account-removal informational state

### Planned

- `/admin/provider-requests` — requires admin claim + feature flag
