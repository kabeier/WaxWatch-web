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

> **Canonical nav source:** `src/components/ui/primitives/shell/primitives.tsx` is the canonical
> rendered-shell nav definition (`APP_NAV_ITEMS`, `MOBILE_NAV_ITEMS`, and `DEFAULT_UTILITY_ITEMS`).
> Mobile tab membership/order is derived from `mobileNavigationRouteKeys` in
> `src/lib/view-models/routes.ts`. Keep this document and `docs/IA_MAP.md` aligned whenever either
> source changes.

### Desktop primary nav (sidebar route set)

Desktop primary navigation is the sidebar route set rendered from `APP_NAV_ITEMS` in
`src/components/ui/primitives/shell/primitives.tsx`. In the authenticated shell, this sidebar is
always present and is the primary destination map on desktop/tablet widths. It includes exactly:

1. Dashboard (`/dashboard`)
2. Search (`/search`)
3. Alerts (`/alerts`)
4. Watchlist (`/watchlist`)
5. Notifications (`/notifications`)
6. Integrations (`/integrations`)
7. Settings (`/settings`)

### Top nav utility role (not primary nav)

Top nav is utility/status chrome (brand + utility links), not the primary route navigation surface.
It acts as a utility/status area when utilities are enabled. Where utilities are enabled, links are
rendered by `TopNav` utility items and default to `DEFAULT_UTILITY_ITEMS`:

- Inbox (`/notifications`)
- Account (`/settings/profile`)

In auth pages (`app/(auth)`), top nav still renders brand/home but utilities are intentionally
hidden via `showUtilities={false}`.

### Mobile primary nav (bottom-tab route set)

Mobile primary navigation is the bottom-tab route set defined by
`mobileNavigationRouteKeys` in `src/lib/view-models/routes.ts` and rendered as
`MOBILE_NAV_ITEMS` in `src/components/ui/primitives/shell/primitives.tsx`. Tabs render in `AppShell` and are shown only on mobile viewport widths (`max-width: 767px`) when
`mobileTabBarVisibility` is `auto` (current `(app)` shell behavior), or always when explicitly set
to `always`. The shipped authenticated tab set includes exactly:

1. Home (`/dashboard`)
2. Alerts (`/alerts`)
3. Watchlist (`/watchlist`)
4. Notifications (`/notifications`)
5. Settings (`/settings`)

`/search` and `/integrations` remain first-class signed-in routes, but they are not bottom-tab items on mobile.
Users reach them from in-route links/CTAs (for example Dashboard quick actions) and by direct route entry.

### Pattern summary (canonical)

- Desktop/tablet: sidebar is the primary route map.
- Mobile: bottom tabs are the primary route map.
- Top nav: utility/status chrome only (brand + utility links), not a primary route map.

## Route maturity/status

Route maturity definitions and the up-to-date status matrix are maintained in `docs/DEVELOPER_REFERENCE.md` under **Route matrix**.

Route maturity promotion/finalization requires fully green gate evidence (`build` + `a11y:smoke` + route-status gate). Until that evidence is available, treat the canonical matrix as the current working status snapshot (not a newly finalized release baseline).

When route statuses change, update that matrix in the same PR so this repo keeps a single canonical status source, and keep this summary aligned when the production-ready route set changes.

## Verification lock (2026-03-26 local full-script rerun)

Requested full verification (`test:run`, `typecheck`, `lint`, `format:check`, `build`, `a11y:smoke`, `docs:route-status-gate`) was rerun on **March 26, 2026** in this workspace.

Result in this workspace: **partially green (environment/network limited)**.

- ✅ `npm run test:run` passed (51/51 files, 432/432 tests).
- ✅ `npm run typecheck`, `npm run lint`, and `npm run format:check` all passed.
- ❌ `npm run build` passed env-contract validation, then failed while downloading Next.js SWC binary `@next/swc-linux-x64-gnu` (`ENETUNREACH`), so standalone build output was not generated.
- ⚠️ `npm run a11y:smoke` failed before browser checks because `npm run start` exited with `startup_missing_build_artifact` (`.next/standalone/server.js` missing).
- ⚠️ `GITHUB_BASE_REF=main npm run docs:route-status-gate` exited with skip because the script could not fetch `origin/main` (`fatal: 'origin' does not appear to be a git repository`).

Since the full gate run did not complete end-to-end, do not newly finalize route maturity promotions from this workspace run.
