# Auth Model (Supabase + Backend API)

## Responsibility split

- Supabase owns login + refresh for user sessions.
- WaxWatch backend authorizes all `/api/**` routes using JWT bearer tokens.
- The shared API client is the canonical place where auth lifecycle side effects are triggered.

## Canonical auth lifecycle (web + mobile)

All auth transitions must flow through `createApiClient(..., { authSessionAdapter })` hooks.

1. API client fetches token via `authSessionAdapter.getAccessToken()`.
2. API client includes `Authorization: Bearer <jwt>`.
3. API client routes auth outcomes through adapter hooks:
   - `401/403` → `clearSession` → `emitAuthEvent("reauth-required")` → `redirectToSignedOut("reauth-required")`
   - `POST /me/logout` success → `clearSession` → `emitAuthEvent("signed-out")` → `redirectToSignedOut("signed-out")`
   - `DELETE /me` or `DELETE /me/hard-delete` success → `clearSession` → `emitAuthEvent("account-removed")` → `redirectToAccountRemoved()`

### Important rule

Do not duplicate these transitions in feature code (SSE controllers, screens, pages, hooks). Consumers should call shared API/client lifecycle helpers and rely on adapter behavior.

## Frontend requirements

- Provide a platform-specific `AuthSessionAdapter` implementation.
- Web and mobile adapters must preserve the same ordering and event semantics listed above.
- Do not attempt to "fix" tokens client-side beyond Supabase refresh/session APIs.

## Mobile handoff

React Native should open secure web auth/handoff flows for sign-up/login/account/subscription management and resume via validated deep-link callback.

### Web-only routes

- `/login`
- `/signup`
- `/account`
- `/account/subscription`

RN should route users to those web screens for auth/account/subscription actions.

### Return URL / deep-link contract

The web auth routes accept:

- `return_to` (optional): relative allowlisted web route.
- `handoff` (optional): `waxwatch://...`, `waxwatch-dev://...`, or `https://*.waxwatch.app/...`.
- `state` (required when `handoff` is set): CSRF binding value.
- `nonce` (required when `handoff` is set): one-time replay-protection value.
- `expires_at` (required when `handoff` is set): expiry timestamp.

Recommended callback:

- `waxwatch://auth/callback?status=<success|cancel|error>&state=<state>&code=<code>&error_code=<error_code>&error_message=<error_message>`

### Outcomes and security checks

Expected outcomes:

- `success`: user authenticated/completed required updates.
- `cancel`: user exited flow.
- `error`: validation/provider/expiry/other failure.

Required checks before redirecting back to mobile:

- Validate `state`.
- Validate `nonce` presence + one-time use.
- Validate `expires_at` not expired.
- Reject untrusted `handoff` origins/schemes.
- Reject non-allowlisted `return_to` values.
- Invalidate artifacts after callback generation.

### Backend/frontend requirements for continuation

Backend:

- Expose exchange/continuation endpoint after successful web handoff.
- Bind `code`/`state`/`nonce` to user+device context with short TTL.
- Enforce one-time use.
- Return account/subscription entitlements via backend APIs.

Frontend:

- RN launches web flows and avoids native IAP logic for these paths.
- RN handles callback status and exchanges `code` with backend.
- RN stores resulting credentials securely.
- RN and web both use auth adapters with the same API-client-driven lifecycle semantics.
