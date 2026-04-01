# Information Architecture (IA)

## Signed-in app navigation model

> **Canonical source note:** Treat `src/components/ui/primitives/shell/primitives.tsx` as the canonical source for shell navigation surfaces and default nav item wiring (`APP_NAV_ITEMS`, `MOBILE_NAV_ITEMS`, `TopNav`, `SideNav`, `MobileTabBar`). Route metadata in `src/lib/view-models/routes.ts` feeds labels/keys for mobile tab generation. If either changes, update this doc and `docs/ROUTES.md` in the same PR.

### Navigation surface responsibilities

- **Primary app navigation**
  - **Desktop/tablet (`>=768px`)**: `SideNav` is the primary destination inventory for signed-in routes.
  - **Mobile phone (`<=767px`)**: `MobileTabBar` is the primary destination inventory.
- **Top utility navigation (`TopNav`)**
  - Always provides brand/home entry (`ShellBrand` -> `/dashboard` by default).
  - Provides utility/status shortcuts only (not primary route inventory).
  - On auth-state routes (`app/(auth)`), utilities are intentionally hidden (`showUtilities={false}`).

### Desktop + sidebar behavior (actual)

`SideNav` is wired into the authenticated shell by default and uses `APP_NAV_ITEMS`.

- **Desktop/tablet (`>=768px`)**: sidebar is visible and functions as the primary route map.
- **Mobile (`<=767px`)**: sidebar remains in shell composition but is hidden by CSS (`.app-shell__sidebar { display: none; }`).

Sidebar route set:

1. Dashboard (`/dashboard`)
2. Search (`/search`)
3. Alerts (`/alerts`)
4. Watchlist (`/watchlist`)
5. Notifications (`/notifications`)
6. Integrations (`/integrations`)
7. Settings (`/settings`)

### Top utility nav role vs primary route navigation

Top nav is intentionally **not** the primary destination inventory.

- Renders `ShellBrand` (brand/home).
- Renders utility links sourced from `TopNav` utility items (`DEFAULT_UTILITY_ITEMS` fallback; app shell can hydrate via `useAppShellChromeData`).
- Auth pages (`app/(auth)`) still render brand/home but hide utility links with `showUtilities={false}`.

Default utility links:

- Inbox (`/notifications`)
- Account (`/settings/profile`)

### Mobile tab behavior (actual)

`MobileTabBar` renders `MOBILE_NAV_ITEMS` (derived from `mobileNavigationRouteKeys`). In `AppShell`, mounting is controlled by `mobileTabBarVisibility`:

- `auto` (authenticated shell default): `MobileOnlySlot` mounts tabs only when viewport is `max-width: 767px`.
- `always`: `MobileOnlySlot` keeps the tab subtree mounted regardless of viewport.

Shell CSS controls visual display in standard responsive layouts (`.app-shell__bottom-tabs` + `.mobile-tab-bar` on `max-width: 767px`).

Canonical shipped mobile tab set:

1. Home (`/dashboard`)
2. Alerts (`/alerts`)
3. Watchlist (`/watchlist`)
4. Notifications (`/notifications`)
5. Settings (`/settings`)

`/search` and `/integrations` are intentionally excluded from mobile tabs and remain first-class routes via direct URL and in-flow links/CTAs.

### Pattern summary

- Desktop/tablet: `SideNav` is the primary route map.
- Mobile phone: `MobileTabBar` is the primary route map.
- Top nav: utility/status chrome only (brand + utility shortcuts).

## Auth + account lifecycle routes (supporting IA)

- Login (`/login`)
- Signed-out confirmation (`/signed-out`)
- Account removed confirmation (`/account-removed`)

## “Search is add alert”

Search is a user flow that can end in either:

- clicking through to listings, OR
- saving the search as an alert, OR
- both

Even when search returns zero results, “Save as alert” remains available.
