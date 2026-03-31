# Data Fetching

## One API client wrapper

All requests go through a single wrapper to enforce:

- platform auth transport via shared adapter/client lifecycle
  - web: cookie-session mode (`credentials: "include"` with backend-managed `httpOnly` cookies)
  - mobile/native: bearer mode (`Authorization: Bearer <jwt>`)
- consistent base URL
- error envelope parsing
- Retry-After handling for 429
- sign-out handling for 401/403

## Retry policy

Recommended:

- GET requests: retry 1–2 times for network errors only (not for 4xx).
- Mutations: no automatic retries; user-triggered retry only.

## Rate limiting (429)

When 429 is returned:

- Read `Retry-After` header (seconds)
- Back off all automated refetches for that scope until the window passes
- Show a banner/toast
- Keep the app usable for other sections

## Partial provider failures in Search

`POST /api/search` can return:

- `items` (possibly non-empty)
- `provider_errors` (map)

UI behavior:

- Render `items` regardless
- Surface provider-specific warnings, but do not treat as a fatal error
