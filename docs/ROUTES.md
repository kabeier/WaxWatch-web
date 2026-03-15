# Routes

This app uses Next.js **App Router**.

## Project decision

- ✅ Decision: migrate to **Next.js App Router now** and treat `app/` as the canonical route tree.
- Keep `pages/api/*` for API routes only during this phase.

## Layout groups

Currently implemented route groups/files:

- `app/(auth)/...` signed-out routes (login and account/session states)
- `app/(app)/...` authenticated shell routes

Planned/optional route group (not currently in tree):

- `app/(app)/admin/...` admin routes only if introduced later
  - Must be gated by feature flag + admin claim per `docs/ADMIN_POLICY.md`

## Route map

## Design-system guardrails for all new route work

All new route implementation/migration work must compose shared primitives first and avoid route-specific ad-hoc styling patterns.

- Use state primitives from `src/components/ui/primitives/state` for loading, empty, error, and rate-limited route states.
- Use shell primitives from `src/components/ui/primitives/shell` for route-level layout scaffolding and navigation chrome.
- Promote any missing visual behavior into shared primitives/tokens before consuming it in route pages.

## Route maturity/status (canonical guidance)

Route maturity definitions and the up-to-date status matrix are maintained in `docs/DEVELOPER_REFERENCE.md` under **Route matrix**.

When route statuses change, update that matrix in the same PR so this repo keeps a single canonical status source.

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

- `/` — unconditional server redirect entrypoint to `/search`; non-production-ready until dedicated route-level redirect contract coverage (including destination-regression protection) is added independent of `/search` implementation details
- `/signed-out` — post-logout informational state
- `/account-removed` — post-account-removal informational state

### Planned

- `/admin/provider-requests` — optional future admin route; if implemented, must follow `docs/ADMIN_POLICY.md`
