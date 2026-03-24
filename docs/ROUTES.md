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

- `/dashboard` — canonical signed-in landing page with live metrics/previews for alerts, watchlist matches, and notifications
- `/search` — search listings + save search as alert
- `/alerts` — list alerts (watch rules)
- `/alerts/new` — create alert
- `/alerts/[id]` — alert detail/edit
- `/watchlist` — list/manage tracked releases
- `/watchlist/[id]` — canonical watchlist item detail/editor with inline validation and confirmed disable flow
- `/notifications` — inbox + mark read/unread
- `/integrations` — Discogs connect/import/status
- `/settings` — settings landing shell
- `/settings/profile` — profile + preferences
- `/settings/alerts` — alert delivery settings (quiet hours, frequency)
- `/settings/danger` — two-card danger zone for deactivate + permanent delete with explicit confirmation dialogs

### Signed-out routes

- `/login` — first-party credential sign-in with secure handoff validation and cooldown-aware rate-limit errors
- `/signed-out` — post-logout informational state
- `/account-removed` — post-account-removal informational state

### Compatibility redirects

- `/` -> `/dashboard`
- `/settings/integrations` -> `/integrations` (immediate compatibility redirect; no dedicated page UI)

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
2. Alerts (`/alerts`)
3. Watchlist (`/watchlist`)
4. Notifications (`/notifications`)
5. Settings (`/settings`)

Search (`/search`) remains a first-class signed-in route, but it is not a bottom-tab item on mobile.
Users reach Search from in-route links/CTAs (for example Dashboard quick actions) and by direct route entry.

## Route maturity/status

Route maturity definitions and the up-to-date status matrix are maintained in `docs/DEVELOPER_REFERENCE.md` under **Route matrix**.

Production-ready routes include fully data-backed surfaces such as `/dashboard`, `/watchlist/[id]`, `/search`, `/settings/profile`, and `/settings/danger`, plus account-state/auth pages like `/login`, `/signed-out`, and `/account-removed` (see the canonical matrix in `docs/DEVELOPER_REFERENCE.md`).

When route statuses change, update that matrix in the same PR so this repo keeps a single canonical status source, and keep this summary aligned when the production-ready route set changes.

## Verification lock (2026-03-24)

The route summary in this file is locked to outcomes from a full verification-gate rerun re-verified in this workspace on March 24, 2026:

- Passed: `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run format:check`.
- Route gate script executed: `npm run docs:route-status-gate` (reported skip because `GITHUB_BASE_REF` is not set outside PR/CI).
- PR-base route gate attempt executed: `GITHUB_BASE_REF=main npm run docs:route-status-gate` (reported skip because this workspace cannot fetch `origin/main`; `fatal: 'origin' does not appear to be a git repository`).
- Not completed here: `npm run build` (Next.js SWC download failed with `ENETUNREACH`) and therefore `npm run a11y:smoke` (requires built standalone artifact at `.next/standalone/server.js`).

Treat `docs/DEVELOPER_REFERENCE.md` as the canonical matrix, and consider production-build/a11y confirmation still pending until those two gates pass in a network-capable CI or release environment.
