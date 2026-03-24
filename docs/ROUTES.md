# Routes

This app uses Next.js **App Router**.

## Canonical route model

- `app/` is the single source of truth for route ownership.
- `/` is a server redirect entrypoint to `/dashboard`.
- `/dashboard` is the canonical signed-in landing route.
- `/search` remains a first-class top-level task route for discovery and save-as-alert flows.
- `/integrations` is the canonical integrations route.
- `/settings/integrations` exists only as a compatibility redirect to `/integrations`.
- `/settings` is a real landing/tab-shell route for account and preference pages.

## Layout groups

Implemented route groups/files:

- `app/(auth)/...` signed-out auth/account-state routes
- `app/(app)/...` authenticated shell routes

Planned/optional route group (not currently in tree):

- `app/(app)/admin/...` admin routes only if introduced later
  - Must be gated by feature flag + admin claim per `docs/ADMIN_POLICY.md`

## Design-system guardrails for all new route work

All new route implementation/migration work must compose shared primitives first and avoid route-specific ad-hoc styling patterns.

- Use state primitives from `src/components/ui/primitives/state` for loading, empty, error, and rate-limited route states.
- Use shell primitives from `src/components/ui/primitives/shell` for route-level layout scaffolding and navigation chrome.
- Promote any missing visual behavior into shared primitives/tokens before consuming it in route pages.

## Signed-in route inventory

### Primary app destinations

- `/dashboard` — canonical signed-in landing page
- `/search` — search listings + save search as alert
- `/alerts` — list alerts (watch rules)
- `/alerts/new` — create alert
- `/alerts/[id]` — alert detail/edit
- `/watchlist` — list/manage tracked releases
- `/watchlist/[id]` — canonical watchlist item detail + editor route
- `/notifications` — inbox + mark read/unread
- `/integrations` — Discogs connect/import/status
- `/settings` — settings landing shell
- `/settings/profile` — profile + preferences
- `/settings/alerts` — alert delivery settings (quiet hours, frequency)
- `/settings/danger` — deactivate + hard delete

### Signed-out routes

- `/login` — first-party credential sign-in with optional secure mobile handoff context
- `/signed-out` — post-logout informational state
- `/account-removed` — post-account-removal informational state

### Compatibility redirects

- `/` -> `/dashboard`
- `/settings/integrations` -> `/integrations`

### Deferred / future surfaces

- Marketing landing
- How it works
- Pricing
- `/admin/provider-requests` — optional future admin route; if implemented, must follow `docs/ADMIN_POLICY.md`

## Navigation model

### Desktop sidebar

1. Dashboard
2. Search
3. Alerts
4. Watchlist
5. Notifications
6. Integrations
7. Settings

### Mobile bottom navigation

1. Home (`/dashboard`)
2. Search (`/search`)
3. Alerts (`/alerts`)
4. Watchlist (`/watchlist`)
5. Settings (`/settings`)

Notifications remain available via the top utility/inbox affordance.

## Route maturity/status

Route maturity definitions and the up-to-date status matrix are maintained in `docs/DEVELOPER_REFERENCE.md` under **Route matrix**.

Production-ready route shells currently include `/dashboard`, `/settings`, `/watchlist/[id]`, `/login`, `/signed-out`, and `/account-removed`; data-backed production-ready routes include `/search` and `/settings/profile` alongside the other routes marked ready in `docs/DEVELOPER_REFERENCE.md`.

When route statuses change, update that matrix in the same PR so this repo keeps a single canonical status source, and keep this summary aligned when the production-ready route set changes.
