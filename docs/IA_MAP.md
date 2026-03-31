# Information Architecture (IA)

## Signed-in app navigation model

> **Canonical source note:** Navigation behavior is defined by shell primitives in `src/components/ui/primitives/shell/primitives.tsx` (rendered surfaces + item wiring), with route metadata in `src/lib/view-models/routes.ts` (labels + mobile key selection). If those definitions change, update this doc and `docs/ROUTES.md` in the same PR.

### Navigation surface responsibilities

- **Primary app navigation**
  - **Desktop/tablet:** `SideNav` is the primary destination inventory for signed-in routes.
  - **Mobile phone:** `MobileTabBar` is the primary destination inventory at `max-width: 767px`.
- **Top utility navigation (`TopNav`)**
  - Always provides brand/home entry (`ShellBrand`).
  - Provides utility/status shortcuts (not the full destination map).
  - On auth-state routes (`app/(auth)`), utilities are intentionally hidden (`showUtilities={false}`).

### Desktop + sidebar behavior (actual)

`SideNav` is wired into the authenticated shell by default and uses `APP_NAV_ITEMS`.
Behavior by breakpoint:

- **Desktop/tablet (`>=768px`)**: sidebar is visible and is the primary route map.
- **Mobile (`<=767px`)**: sidebar still exists in shell composition but is hidden by CSS (`.app-shell__sidebar { display: none; }` in the mobile breakpoint).

Sidebar route set:

1. Dashboard (`/dashboard`)
2. Search (`/search`)
3. Alerts (`/alerts`)
4. Watchlist (`/watchlist`)
5. Notifications (`/notifications`)
6. Integrations (`/integrations`)
7. Settings (`/settings`)

### Top utility nav role vs primary destination nav

Top nav is intentionally **not** the primary destination inventory.

- Always renders `ShellBrand` (brand/home entry).
- Renders utility links from `TopNav` utility items (`DEFAULT_UTILITY_ITEMS` fallback, hydrated in app shell via `useAppShellChromeData`).
- On auth-state pages (`app/(auth)`), top nav still renders brand/home but hides utilities with `showUtilities={false}`.

Default utility links:

- Inbox (`/notifications`)
- Account (`/settings/profile`)

### Mobile tab behavior (actual)

`MobileTabBar` renders `MOBILE_NAV_ITEMS` (from `mobileNavigationRouteKeys`). In `AppShell`, tab mounting is controlled by `mobileTabBarVisibility`:

- `auto` (current authenticated shell default): `MobileOnlySlot` mounts tabs only when viewport is `max-width: 767px`.
- `always`: `MobileOnlySlot` keeps the tab subtree mounted regardless of viewport.

Shell CSS then controls visual display in normal responsive layouts (`.app-shell__bottom-tabs` + `.mobile-tab-bar` display at `max-width: 767px`). Canonical shipped mobile tab set:

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
