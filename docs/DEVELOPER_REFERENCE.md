# WaxWatch Frontend (Next.js)

WaxWatch is a record-price alert web app. Users can search listings across providers, save searches as alerts, manage alerts/watchlist, and receive notifications.

## Developer quickstart (read this first)

### 1) Boot your local environment

```bash
cp .env.example .env
npm install
npm run env:check:template
```

Minimum local values are already provided in `.env.example` (for example: `NODE_ENV=development`, `APP_BASE_URL=http://localhost:3000`, and local-safe placeholders for Sentry/AWS keys). Keep these keys present because `src/config/env.ts` requires all of them at runtime.

For production deployments, replace placeholder/template values with environment-specific secrets and infrastructure values (especially `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `AWS_SECRETS_PREFIX`, and `TRUSTED_PROXY_CIDRS`).

### 2) Confirm API contracts before building

```bash
npm run contracts:check
```

Before changing route-level rendering for API-backed screens (`/search`, `/alerts`, `/watchlist`, `/notifications`, `/settings/profile`, `/settings/integrations`), confirm transport shapes in `docs/FRONTEND_API_CONTRACT.md` and align `src/lib/api/domains/*` + query hooks first (contract-first, then UI).

### 3) Run the app + common contributor commands

```bash
npm run dev
```

Open: http://localhost:3000

- `npm run build`
- `npm run start`
- `npm run test`
- `npm run lint`
- `npm run format`

### Read this first (in order)

1. `docs/AGENT_GUIDE.md`
2. `docs/ROUTES.md`
3. `docs/FRONTEND_API_CONTRACT.md`
4. `docs/SSE_MODEL.md`
5. `docs/DESIGN_SYSTEM.md`

Route maturity/status guidance is canonical in this reference's **Route matrix** section and in `docs/ROUTES.md`.

## Stack (production)

- Next.js **App Router**
- TypeScript
- Supabase Auth (client session) + WaxWatch Backend API (JWT bearer)
- TanStack Query for server state (Option A: SPA-style dashboard)
- SSE for realtime notifications

## Architecture layering: api core vs web query

WaxWatch uses a strict layering split for data access code:

- `src/lib/api/*` is **api core** and must stay platform-agnostic. This layer owns transport/domain types, API errors, pagination/rate-limit helpers, the API client, and domain services.
- `src/lib/query/*` is the **web integration layer**. It wires TanStack Query hooks/mutations to api core services and can import browser/web-specific modules.

### Strict api-core rule

Code in `src/lib/api/*` **must not import or reference**:

- React modules (`react`, `react-dom`, etc.)
- Next.js modules (`next/*`)
- Browser globals (`window`, `document`, `localStorage`, `sessionStorage`)
- Web query/UI modules (`src/lib/query/*`, `src/components/*`)

Any browser assumptions must live behind injected adapters (for example `AuthSessionAdapter`) that are provided by the web layer.

### Guardrails

- ESLint override for `src/lib/api/**/*` blocks restricted imports/globals.
- CI/local script `npm run lint:api-core-boundaries` (`scripts/check-api-core-boundaries.mjs`) fails on disallowed imports or browser globals in api-core files.

### Logger import convention

- Use `@/lib/logger` for logger imports from any file outside `src/lib` root peers.
- Use relative imports only for same-folder logger imports (for example `./logger` inside `src/lib`).
- Avoid parent-relative (`../logger`) logger imports; ESLint enforces canonical forms.

### Web vs Mobile ownership

- **Shared (web + mobile):** `src/lib/api/*` contracts/client/domain services and related domain types/errors.
  - API/client expectation: domain services should expose only user-facing endpoints in current product scope; admin/dev-only routes (for example hard-delete watch-rule endpoints) are intentionally excluded unless product scope changes.
- **Web-owned:** `src/lib/query/*`, React hooks, and browser adapters such as `webAuthSessionAdapter`.
- **Mobile-owned (future):** a mobile adapter layer can consume `src/lib/api/*` directly, providing mobile-specific auth/session/storage adapters without importing `src/lib/query/*`.

## Runtime topology (AWS EC2)

`Route53 -> ALB (TLS termination) -> EC2 ASG -> Next.js standalone container (port 4173)`

Health endpoints for ALB target group checks:

- `/health` (liveness)
- `/ready` (readiness)

See: `docs/deploy/aws-ec2.md`

## Contracts (do not invent API)

This repo is contract-driven. These are authoritative:

- `contracts/openapi.snapshot.json` (pinned schema snapshot)
- `docs/FRONTEND_API_CONTRACT.md` (behavior notes + screen mapping)

Validate these paths in CI (or locally) with:

- `npm run contracts:check`
- Before changing route-level rendering for API-backed screens (`/search`, `/alerts`, `/watchlist`, `/notifications`, `/settings/profile`, `/settings/integrations`), confirm transport shapes in `docs/FRONTEND_API_CONTRACT.md` and align `src/lib/api/domains/*` + query hooks first (contract-first, then UI).

## Dev commands (expected)

- `npm run env:check:template` (pre-flight: verifies `.env.example` stays aligned with `src/config/env.ts`)
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run test`
- `npm run lint`
- `npm run format`

(Exact scripts depend on repo package.json; keep docs aligned with the repo.)

## Route matrix

Status criteria used in this matrix:

- `scaffold`: route exists, but is still placeholder-first (including synthetic state toggles via URL/search params) and does not yet use real API wiring.
- `wired-minimum`: route uses real TanStack Query hooks and/or mutations connected to the API client, with baseline form validation and pending/error handling.
- `production-ready`: route has complete UX polish, robust error/retry flows, accessibility coverage, and automated tests.

| Route                      | Status           | Notes                                                                                                         |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `/`                        | scaffold         | Redirect exists, but landing flow depends on `/search`, which is still synthetic-state scaffolding.           |
| `/login`                   | scaffold         | Sign-in shell placeholder for Supabase auth UI.                                                               |
| `/search`                  | production-ready | Full UX states, validation/mutation hardening, cooldown-aware retries, and route-level success/failure tests. |
| `/alerts`                  | production-ready | Full query UX states with retry actions (including cooldown handling) and route-level success/failure tests.  |
| `/alerts/new`              | production-ready | Full setup/create UX states, validation/pending feedback, and route-level success/failure tests.              |
| `/alerts/[id]`             | production-ready | Full detail/edit/delete UX states, retry behavior, and route-level success/failure tests.                     |
| `/watchlist`               | production-ready | Full loading/empty/error/rate-limited behavior with explicit retry/cooldown actions and route-level tests.    |
| `/notifications`           | production-ready | Full feed/mutation UX states, retry/cooldown behavior, and route-level success/failure tests.                 |
| `/settings/profile`        | production-ready | Full profile settings UX with validation, pending/disabled controls, cooldown-aware retries, and route tests. |
| `/settings/alerts`         | production-ready | Full settings UX states, validation/pending/success handling, cooldown-aware retries, and route-level tests.  |
| `/settings/integrations`   | production-ready | Full Discogs integration UX with retry/cooldown handling and route-level success/failure tests.               |
| `/settings/danger`         | production-ready | Full danger-zone UX states with robust pending/success/error handling and route-level success/failure tests.  |
| `/signed-out`              | scaffold         | Static confirmation page exists; no API wiring or production-hardening checks yet.                            |
| `/account-removed`         | scaffold         | Static confirmation page exists; no API wiring or production-hardening checks yet.                            |
| `/admin/provider-requests` | planned          | Admin-only route; not yet present in `app/`.                                                                  |

### How to pick next work

Prioritize routes marked `scaffold` first, especially routes still driven by synthetic state switches. Converting these to `wired-minimum` (real hooks/mutations through the API client) closes the biggest delivery gap. After that, move `wired-minimum` routes toward `production-ready` by adding end-to-end UX polish, retry behavior, accessibility validation, and automated tests.

### Route matrix status-change workflow (PR requirement)

Any PR that changes one or more route statuses in the matrix above must include a dedicated PR section with:

1. **Route(s) changed** (exact path names from the matrix).
2. **Current status -> target status** for each changed route.
3. **Checklist evidence** that supports the target status:
   - UX state coverage (loading, empty, success, error, and rate-limited/cooldown states where applicable).
   - Validation behavior (required-field checks, invalid input handling, and clear recovery paths).
   - Retry behavior (explicit retry actions and cooldown-aware handling when applicable).
   - Route-level automated tests added/updated in the same PR.
   - Accessibility validation evidence (for example: semantic roles/labels, keyboard behavior, and/or a11y smoke coverage).

When moving a route to `production-ready`, reviewers should reject the status change if this evidence is missing or if route-level test updates are absent.

### SSE verification (contributor workflow)

For PRs that touch realtime streaming (`src/components/SseController.tsx`, `/api/stream/events`, or SSE-related auth/reconnect logic), include an "SSE verification" checklist in the PR description and confirm the done criteria in `docs/SSE_MODEL.md#sse-done-criteria`.

See `docs/ROUTES.md` and `docs/IA_MAP.md`.

## Agent work

If you are a code agent, read **docs/AGENT_GUIDE.md** first.
