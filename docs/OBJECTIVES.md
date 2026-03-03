# Objectives (WaxWatch Frontend)

## Product objectives

1. **Fast, reliable dashboard UX**
   - Users can search, save alerts, manage alerts/watchlist, and see notifications.
2. **Contract-driven correctness**
   - UI must match backend contracts (schemas, pagination, errors, throttling).
3. **Operational resilience**
   - Clear handling for rate limiting, partial provider failures, and auth expiry.
4. **Consistent design system**
   - Follow the WaxWatch design guide across all pages/components.
5. **Production-ready deployment**
   - Next.js standalone container behind AWS ALB/EC2 ASG; health endpoints.

## MVP features

- Authenticated app shell with top nav + profile dropdown
- Search listings across providers (POST /api/search)
- Save search as alert (POST /api/search/save-alert)
- Alerts CRUD (watch rules)
- Watchlist management (watch releases)
- Notifications inbox + unread badge
- SSE realtime notifications
- Discogs integration connect/import + imported items list
- Account profile + alert delivery preferences
- Account deactivate + hard delete

## Out of scope (for now)

- Full admin console
- Payments/subscriptions
- Provider onboarding UI
- Public marketing site (can be added later under a separate layout)
