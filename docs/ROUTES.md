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

## Verification lock (2026-03-25)

The route summary in this file is locked to the **release-candidate frontend baseline** after rerunning the release-gate sequence in this workspace on March 25, 2026.

- Group A/B/C outputs are merged into this route summary and synchronized with the canonical route status matrix in `docs/DEVELOPER_REFERENCE.md`.
- Passed: `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run env:check:template`, `npm run contracts:check`, `npm run lint:api-core-boundaries`, `npm run docs:lint:placeholders`, `npm run prebuild:prod-env` (with production-safe sample values).
- Route gate script executed: `GITHUB_BASE_REF=main npm run docs:route-status-gate` (reported skip because this workspace has no fetchable `origin` remote).
- Additional diff-based scripts executed: `npm run test:contract` and `npm run format:check:changed` (both reported skip because `GITHUB_BASE_REF` is not set in this workspace).
- Environment-limited/pending: `npm run build` passed `prebuild` but failed while Next.js attempted SWC download/lockfile patching (`ENETUNREACH`), and `npm run a11y:smoke` then failed because `npm run start` requires `.next/standalone/server.js`.

Treat `docs/DEVELOPER_REFERENCE.md` as the canonical matrix and keep this summary synchronized in the same PR; move both docs to a fully completed verification lock only after `build` and `a11y:smoke` pass in network-capable CI/release infrastructure.
