# Frontend Delivery Plan

## Source of truth

The frontend implementation must stay contract-first and use a single set of upstream references:

1. `docs/FRONTEND_API_CONTRACT.md` for endpoint-level behavior, field semantics, and UI mapping notes.
2. The backend OpenAPI snapshot (checked in API schema) for canonical request/response types, enums, validation rules, and example payloads.

When these sources conflict, treat the OpenAPI snapshot as canonical for wire formats and treat `docs/FRONTEND_API_CONTRACT.md` as canonical for frontend behavior and UX expectations. Any unresolved mismatch should be raised as a contract issue before merging frontend behavior that depends on assumptions.

## Recommended build order

Build and merge in this sequence to minimize blocking and maximize testable vertical slices:

1. Auth/session shell
2. Profile/settings
3. Discogs connect/import
4. Alerts CRUD
5. Notifications + SSE
6. Outbound redirect + provider observability

Each slice should ship as a small, contract-scoped PR with typed client integration and test coverage.

---

## 1) Auth/session shell

### Required endpoints

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/session` (or equivalent current-session endpoint)
- `POST /auth/refresh` (if refresh-token flow is defined)

### Loading/error states

- Initial app boot shows session-check loading shell/skeleton.
- Login submit disables CTA and shows inline progress.
- Invalid credentials show non-destructive form error; preserve entered email/username.
- Expired session should attempt refresh once before hard sign-out.
- Network/server failures show retryable global error boundary for auth bootstrap.

### Empty states

- Signed-out shell with clear primary action (sign in).
- No-profile-yet variant if API allows authenticated but incomplete user profile.

### Done checklist

- [ ] Route guards and auth-aware layout are implemented.
- [ ] Session bootstrap does not cause flicker between signed-in/signed-out states.
- [ ] Typed auth client methods generated/maintained from contract.
- [ ] Unit/integration tests cover success, invalid credentials, expired token, and network failure.
- [ ] Storybook/auth shell fixtures represent signed-out, loading, and error variants.

---

## 2) Profile/settings

### Required endpoints

- `GET /me` (or `GET /profile`)
- `PATCH /me` (or profile update endpoint)
- Settings endpoints (notification preferences, timezone/currency, etc.) defined in the contract.

### Loading/error states

- Settings page-level skeleton while profile/settings fetch is pending.
- Save operations show field-level pending states and optimistic lockout of duplicate submits.
- Validation errors map to field-level messages from API error payloads.
- Concurrent edit/version conflict displays recoverable “refresh and retry” message.

### Empty states

- Missing optional fields show placeholder hints (not hard errors).
- No preferences configured state with “Use defaults” explanation.

### Done checklist

- [ ] Form schemas align with OpenAPI constraints (lengths, enums, required fields).
- [ ] Server validation errors are surfaced without losing dirty form state.
- [ ] Accessibility checks for labels, errors, and keyboard submission pass.
- [ ] Tests cover load, successful save, validation failure, and conflict handling.
- [ ] Storybook variants include pristine, dirty, saving, and error states.

---

## 3) Discogs connect/import

### Required endpoints

- Provider connect start endpoint (e.g., `POST /integrations/discogs/connect` or redirect-start endpoint)
- OAuth callback/result status endpoint
- Import trigger endpoint (e.g., `POST /integrations/discogs/import`)
- Import status/progress endpoint (polling or stream-assisted)

### Loading/error states

- Connect action shows external redirect-in-progress state.
- Callback completion state handles success, denied consent, and provider error.
- Import trigger shows queued/running status and disables duplicate imports.
- Long-running import shows recoverable polling failures with retry/backoff.

### Empty states

- Not connected state with Discogs value proposition + connect CTA.
- Connected but never imported state.
- Imported with no collection items matched state.

### Done checklist

- [ ] OAuth/connect flow is idempotent and safe to re-enter.
- [ ] Import status UI reflects backend lifecycle states exactly.
- [ ] Typed client covers connect, callback status, start import, and status checks.
- [ ] Tests cover connect denial, provider outage, successful import, and empty import results.
- [ ] Storybook captures disconnected, connecting, importing, and completed/empty outcomes.

---

## 4) Alerts CRUD

### Required endpoints

- `GET /alerts`
- `POST /alerts`
- `PATCH /alerts/{id}`
- `DELETE /alerts/{id}`
- Any lookup endpoints needed for alert conditions (artist/release/search selectors)

### Loading/error states

- Alerts list skeleton on first load; subtle refresh indicator on background refetch.
- Create/edit modal shows submit-pending and prevents duplicate requests.
- API validation errors map to specific alert condition fields.
- Delete uses confirm step and handles partial failure with rollback messaging.

### Empty states

- No alerts created state with CTA to create first alert.
- No results after filter/search state distinct from true empty account state.

### Done checklist

- [ ] List, create, edit, delete all wired through typed client.
- [ ] Cache invalidation or optimistic updates keep list consistent.
- [ ] Condition builder reflects contract enums/operators exactly.
- [ ] Tests cover CRUD happy path plus validation and deletion failure.
- [ ] Storybook includes empty, populated, editing, and error variants.

---

## 5) Notifications + SSE

### Required endpoints

- `GET /notifications`
- Mark read/unread endpoints (`POST`/`PATCH` as defined)
- SSE subscribe endpoint (e.g., `GET /notifications/stream`)
- Optional cursor/pagination endpoints for notification history

### Loading/error states

- Notification center shows initial loading and incremental pagination loading.
- SSE connection state shown subtly (connected/reconnecting/offline).
- Transient stream drop triggers automatic reconnect with backoff.
- Permanent auth/permission errors degrade to polling/manual refresh with user notice.

### Empty states

- No notifications yet state with contextual education.
- All caught up state after reading all notifications.

### Done checklist

- [ ] SSE client lifecycle is encapsulated (connect, heartbeat/watchdog, reconnect, cleanup).
- [ ] Duplicate event handling is idempotent (event ID or timestamp guards).
- [ ] Read/unread mutations reconcile with streamed updates.
- [ ] Tests cover stream connect, reconnect, fallback behavior, and read-state updates.
- [ ] Storybook demonstrates empty, live-update, reconnecting, and errored states.

---

## 6) Outbound redirect + provider observability

### Required endpoints

- Outbound redirect creation/track endpoint (e.g., `POST /outbound/resolve`)
- Redirect event tracking endpoint(s) if separate from resolve
- Provider health/observability endpoint(s) exposed to frontend status UI

### Loading/error states

- Redirect CTA shows “resolving destination” transient state before navigation.
- Provider unavailable response presents fallback action without dead-end UX.
- Observability panel handles stale data and partial provider degradation.

### Empty states

- No provider incidents/recent events state.
- No outbound history state (if surfaced to user/admin UX).

### Done checklist

- [ ] Redirect flow preserves analytics/tracking metadata required by contract.
- [ ] Failed resolve paths are measurable and user-recoverable.
- [ ] Observability widgets map backend status enums/severity correctly.
- [ ] Tests cover healthy redirect, provider failure fallback, and degraded provider status rendering.
- [ ] Storybook includes healthy, degraded, and down-provider scenarios.

---

## Fixture strategy (Storybook/tests first)

Before live endpoint wiring in each contract area:

1. Extract example request/response bodies from the backend OpenAPI snapshot.
2. Normalize them into reusable typed fixtures in a shared test-fixtures module.
3. Use those fixtures in Storybook stories, component tests, and route-level integration tests.
4. Add explicit “edge fixtures” for nullable fields, validation errors, empty collections, and pagination boundaries.
5. Only then connect to live API clients, keeping fixture-backed tests as regression guardrails.

This ensures UI states are validated early, and live wiring becomes a transport concern rather than a behavior-discovery phase.

## Codex usage pattern for delivery

Use Codex in tightly scoped PRs that advance one contract area at a time.

### Preferred loop

1. Scaffold route/page shell for the selected contract area.
2. Add/update typed API client functions from OpenAPI contract.
3. Add a minimal test stub (or fixture-backed integration test) proving route/client linkage.
4. Open a small PR with a narrow diff and explicit contract references.

### Rule of thumb

- One PR per contract area sub-slice (not multi-area mega PRs).
- Keep each PR reviewable in under ~300 lines when possible.
- Require contract citation in PR description (endpoint list + schema version/hash).

This pattern keeps delivery parallelizable, easier to review, and resilient to backend contract evolution.
