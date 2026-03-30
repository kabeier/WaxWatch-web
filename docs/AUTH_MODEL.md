# Auth Model (Cookie-Session Web Auth + Backend API)

## Responsibility split

- Backend auth endpoints own login/session issuance and refresh semantics for browser flows.
- **Web (cookie-session mode)** uses backend-managed `httpOnly` session cookies for API auth; browser JavaScript does not manage long-lived bearer tokens in storage.
- **Mobile/native (bearer mode)** continues to use bearer JWTs via secure native storage and transport.
- The shared API client is the canonical place where auth lifecycle side effects are triggered.

Implementation anchors:

- `src/lib/auth-session.ts` defines the web `AuthSessionAdapter` (returns `null` bearer token in web mode, emits lifecycle events, and handles signed-out/account-removed redirects).
- `app/(auth)/login/LoginPageClient.tsx` performs `POST ${resolveApiBaseUrl()}/auth/login` (default `/api/auth/login`) with `credentials: "include"` and enforces secure handoff parameter validation.

## Canonical auth lifecycle (web + mobile)

All auth transitions must flow through `createApiClient(..., { authSessionAdapter })` hooks.

1. API client asks the adapter (or `getJwt`) for auth context.
   - Cookie-session mode (web adapter) returns `null` token and relies on cookie transport.
   - Bearer mode (mobile/explicit `getJwt`) supplies JWTs.
2. API client applies auth transport:
   - Bearer mode: `Authorization: Bearer <jwt>`.
   - Cookie-session mode: sends browser credentials/cookies (`credentials: "include"`).
3. API client routes auth outcomes through adapter hooks:
   - `401/403` → `clearSession` → `emitAuthEvent("reauth-required")` → `redirectToSignedOut("reauth-required")`
   - `POST /me/logout` success → `clearSession` → `emitAuthEvent("signed-out")` → `redirectToSignedOut("signed-out")`
   - `DELETE /me` or `DELETE /me/hard-delete` success → `clearSession` → `emitAuthEvent("account-removed")` → `redirectToAccountRemoved()`

## Canonical login submit flow (web)

`LoginPageClient` follows this sequence:

1. Resolve and validate handoff state before submit when `handoff` is present (`state`/`nonce`/`expires_at` required; expiry enforced).
2. `POST ${resolveApiBaseUrl()}/auth/login` (default `/api/auth/login`) with:
   - `credentials: "include"` (cookie-session transport),
   - JSON body: `email`, `password`, plus optional `return_to`, `handoff`, `state`, `nonce`, `expires_at`.
3. Handle response states:
   - `401/403` (or `invalid_credentials` discriminator) → `"Invalid email or password."`
   - Rate-limited envelope → route to `StateRateLimited`
   - Validation envelope → show backend validation message
4. On success, resolve destination:
   - Valid handoff: redirect to handoff URL with `state`, `nonce`, `expires_at`, `status=success`, and optional `return_to`.
   - Otherwise: redirect to `return_to` or `/`.

### Important rule

Do not duplicate these transitions in feature code (SSE controllers, screens, pages, hooks). Consumers should call shared API/client lifecycle helpers and rely on adapter behavior.

## Web storage strategy and residual risk

### Strategy implemented

- Web no longer reads long-lived access tokens from `localStorage` in `webAuthSessionAdapter.getAccessToken()`.
- Legacy key cleanup (`waxwatch.auth.session`) is best-effort only during `clearSession()`.
- Browser API calls and SSE connections use cookie-session auth (`credentials: "include"`) instead of JavaScript-managed bearer headers.

### Residual risks and trade-offs

- `httpOnly` cookies reduce token theft risk from XSS because JavaScript cannot read session secrets.
- XSS can still issue authenticated requests while a session is active; CSP, output encoding, and dependency hygiene remain mandatory.
- Cookie auth introduces CSRF exposure if endpoints accept ambient cookies without CSRF defenses. Mitigate with `SameSite`, origin/referer checks, and anti-CSRF tokens where needed.
- Mobile/native bearers remain sensitive and must stay in OS-backed secure storage with short TTL + refresh controls.

## Frontend requirements

- Provide a platform-specific `AuthSessionAdapter` implementation.
- Web and mobile adapters must preserve the same ordering and event semantics listed above.
- Do not implement ad-hoc token/session repair logic in feature code; rely on backend auth endpoints and the shared API-client adapter lifecycle.

## Mobile handoff

React Native should open secure web auth/handoff flows for registration/account/subscription management and resume via validated deep-link callback.

Routine sign-in should stay native in the React Native app.

### Web-only routes

- `/signup`
- `/account`
- `/account/subscription`

RN should route users to those web screens for registration/account/subscription actions.

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
