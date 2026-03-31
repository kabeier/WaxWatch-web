# Information Architecture (IA)

## Signed-in app navigation model

> **Canonical source note:** Navigation truth lives in shell code definitions: `src/components/ui/primitives/shell/primitives.tsx` and `src/lib/view-models/routes.ts`. If nav labels/order/visibility change there, update this doc and `docs/ROUTES.md` in the same PR.

### Navigation surface responsibilities

- **Top nav (`TopNav`)** = utility chrome (brand/home + utility links), not primary route IA.
- **Desktop/tablet primary nav (`SideNav`)** = authenticated primary route inventory.
- **Mobile primary nav (`MobileTabBar`)** = authenticated primary route inventory on phones.

### Desktop + sidebar behavior (actual)

`SideNav` is wired into the authenticated shell by default and uses `APP_NAV_ITEMS`.
Behavior by breakpoint:

- **Desktop/tablet (`>=768px`)**: sidebar is visible and is the primary navigation map.
- **Mobile (`<=767px`)**: sidebar remains part of shell composition but is visually hidden by CSS.

Sidebar route set:

1. Dashboard (`/dashboard`)
2. Search (`/search`)
3. Alerts (`/alerts`)
4. Watchlist (`/watchlist`)
5. Notifications (`/notifications`)
6. Integrations (`/integrations`)
7. Settings (`/settings`)

### Top-nav utility role vs primary route navigation

Top nav is intentionally **not** the primary destination inventory.

- Always renders `ShellBrand` (brand/home entry).
- Renders utility links from `TopNav` utility items (`DEFAULT_UTILITY_ITEMS` fallback, hydrated in app shell via `useAppShellChromeData`).
- On auth-state pages (`app/(auth)`), top nav still renders brand/home but hides utilities with `showUtilities={false}`.

Default utility links:

- Inbox (`/notifications`)
- Account (`/settings/profile`)

### Mobile tab behavior (actual)

`MobileTabBar` renders `MOBILE_NAV_ITEMS` (from `mobileNavigationRouteKeys`). In `AppShell`, tab visibility is controlled by `mobileTabBarVisibility`:

- `auto` (current authenticated shell default): render tabs only when viewport is `max-width: 767px`.
- `always`: render tabs regardless of viewport.

In addition, shell CSS only displays the bottom-tab container at `max-width: 767px` in normal responsive layouts. Canonical shipped mobile tab set:

1. Home (`/dashboard`)
2. Alerts (`/alerts`)
3. Watchlist (`/watchlist`)
4. Notifications (`/notifications`)
5. Settings (`/settings`)

`/search` and `/integrations` are intentionally excluded from mobile tabs and remain first-class routes via direct URL and in-flow links/CTAs.

### Pattern summary

- Desktop/tablet: sidebar is primary route map.
- Mobile: bottom tabs are primary route map.
- Top nav: utility/status chrome only.

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
