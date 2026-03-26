# Information Architecture (IA)

## Signed-in app navigation model

### Desktop primary nav (sidebar route set)

Desktop primary navigation is the sidebar route set rendered from `APP_NAV_ITEMS` in
`src/components/ui/primitives/shell/primitives.tsx` and includes exactly:

1. Dashboard (`/dashboard`)
2. Search (`/search`)
3. Alerts (`/alerts`)
4. Watchlist (`/watchlist`)
5. Notifications (`/notifications`)
6. Integrations (`/integrations`)
7. Settings (`/settings`)

### Top nav (utility/account status area)

Top nav is not the primary route map. It is the utility/account status surface: brand/home access plus
utility links rendered via `TopNav` utility items:

- Inbox (`/notifications`)
- Account (`/settings/profile`)

### Mobile primary nav (currently rendered tab set)

Canonical mobile tab ordering is defined in `mobileNavigationRouteKeys` in
`src/lib/view-models/routes.ts`; `MOBILE_NAV_ITEMS` in
`src/components/ui/primitives/shell/primitives.tsx` is derived from that metadata and rendered by
`MobileTabBar`. The current tab set includes exactly:

1. Home (`/dashboard`)
2. Alerts (`/alerts`)
3. Watchlist (`/watchlist`)
4. Notifications (`/notifications`)
5. Settings (`/settings`)

`/search` and `/integrations` are intentionally excluded from mobile bottom tabs and remain
reachable through in-route CTAs/links and direct navigation.

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
