# Information Architecture (IA)

## Signed-in app navigation model

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

### Top nav (utility/account status area)

Top nav is not the primary route map. Where utilities are enabled, it is the utility/account surface:
brand/home access plus utility links rendered via `TopNav` utility items:

- Inbox (`/notifications`)
- Account (`/settings/profile`)

In auth pages (`app/(auth)`), top nav still renders brand/home but utilities are intentionally hidden
via `showUtilities={false}`.

### Mobile primary nav (currently rendered tab set)

Mobile primary navigation is the bottom-tab set defined by
`mobileNavigationRouteKeys` in `src/lib/view-models/routes.ts` and rendered via
`MOBILE_NAV_ITEMS` in `src/components/ui/primitives/shell/primitives.tsx`. Tabs are rendered in
`AppShell` and shown only
for mobile viewport widths (`max-width: 767px`) when `mobileTabBarVisibility` is `auto` (the current
authenticated-shell behavior). The tab set includes exactly:

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
