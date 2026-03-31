# Information Architecture (IA)

## Signed-in app navigation model

> **Canonical nav source:** `src/components/ui/primitives/shell/primitives.tsx` is the canonical
> rendered-shell nav definition (`APP_NAV_ITEMS`, `MOBILE_NAV_ITEMS`, and `DEFAULT_UTILITY_ITEMS`).
> Mobile tab membership/order is derived from `mobileNavigationRouteKeys` in
> `src/lib/view-models/routes.ts`. Keep this document and `docs/ROUTES.md` aligned whenever either
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

Top nav is not the primary route map. In the shipped shell model it is a utility/status area when
utilities are enabled: brand/home access plus utility links rendered via `TopNav` utility items
(defaulting to `DEFAULT_UTILITY_ITEMS`):

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

`/search` and `/integrations` are intentionally excluded from mobile bottom tabs and remain
first-class routes reachable through in-route CTAs/links and direct navigation.

### Pattern summary (canonical)

- Desktop/tablet: sidebar is the primary route map.
- Mobile: bottom tabs are the primary route map.
- Top nav: utility/status chrome only (brand + utility links), not a primary route map.

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
