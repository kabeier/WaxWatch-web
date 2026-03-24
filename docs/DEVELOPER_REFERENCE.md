# WaxWatch Frontend (Next.js)

## Verification lock (2026-03-24)

This reference is locked to outcomes that were **directly re-verified** in this workspace on **March 24, 2026**.

Verified pass gates:

- `npm run test:run`
- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run docs:route-status-gate` (script executed; reports `Skipping route-status test gate (GITHUB_BASE_REF not set).` when no base ref is provided)

Not fully verifiable in this workspace run:

- `npm run build` could not complete because Next.js attempted to fetch missing SWC binaries and failed with `ENETUNREACH`.
- `npm run a11y:smoke` could not complete because `npm run start` requires `.next/standalone/server.js`, which is produced only after a successful build.
- `GITHUB_BASE_REF=main npm run docs:route-status-gate` also skipped because this workspace has no reachable `origin` remote (`fatal: 'origin' does not appear to be a git repository`), so PR-base route-promotion diff checks could not be executed locally.

Route maturity statements below therefore remain constrained to test/typecheck/lint/format evidence plus route-level/unit coverage already present in this repo; production-build and a11y-smoke confirmation is pending a network-capable build environment.

WaxWatch is a record-price alert web app. Users can land on a dashboard, search listings across providers, save searches as alerts, manage alerts/watchlist, connect integrations, and receive notifications.

## Developer quickstart (read this first)

### 1) Boot your local environment

```bash
cp .env.example .env
npm install
npm run env:check:template
```

Minimum local values are already provided in `.env.example` (for example: `NODE_ENV=development`, `APP_BASE_URL=http://localhost:3000`, and local-safe placeholders for Sentry/AWS keys). Keep these keys present because `src/config/env.ts` requires all of them at runtime.

`NEXT_PUBLIC_API_BASE_URL` controls which base URL the browser API client uses:

- Same-origin deployment (default): `NEXT_PUBLIC_API_BASE_URL=/api`
  - Expected for standard Next.js + backend co-hosting/reverse-proxy setups where app and API share an origin.
- Cross-origin deployment: `NEXT_PUBLIC_API_BASE_URL=https://api.example.com`
  - Use when frontend and backend are on different origins.
  - You must configure backend CORS + auth/session behavior for cross-origin browser requests.

If `NEXT_PUBLIC_API_BASE_URL` is omitted, the client explicitly falls back to `/api`.

CSP policy baseline for deployments (canonical model: **build-time**):

- For Next.js standalone output, CSP values from `next.config.mjs` are computed at build time.
- `CSP_CONNECT_SRC`, `CSP_STYLE_SRC`, and `NEXT_PUBLIC_API_BASE_URL` must be present before `npm run build` when you need non-default CSP/API-origin behavior.
- Run `npm run prebuild:prod-env` as the gate directly before `npm run build`; it reports whether same-origin defaults are accepted or a cross-origin configuration is expected but missing.
- Runtime-only env changes do not rewrite emitted CSP headers.
- `style-src` allows `'self'` plus optional explicit origins configured through `CSP_STYLE_SRC`.
- `style-src` must not include `'unsafe-inline'` in production.
- Inline style attributes should be migrated to CSS classes in `src/styles/global.css` (or scoped stylesheet files) instead of runtime `style={...}` objects.
- Deployment validation must run with `VERIFY_ENVIRONMENT=production` to enforce the style policy.

CSP style exceptions process:

1. Create a security-review ticket for each new style origin.
2. Use explicit HTTPS origins only; no wildcard entries.
3. Add the origin via `CSP_STYLE_SRC`, verify in staging, then record owner + expiry/review date.

For production deployments, replace placeholder/template values with environment-specific secrets and infrastructure values (especially `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `AWS_SECRETS_PREFIX`, and `TRUSTED_PROXY_CIDRS`).

### 2) Confirm API contracts before building

```bash
npm run contracts:check
```

Before changing route-level rendering for API-backed screens (`/dashboard`, `/search`, `/alerts`, `/watchlist`, `/notifications`, `/integrations`, `/settings/profile`, `/settings/alerts`), confirm transport shapes in `docs/FRONTEND_API_CONTRACT.md` and align `src/lib/api/domains/*` + query hooks first (contract-first, then UI).

### 3) Run the app + common contributor commands

Startup sequence:

- Development: `npm run dev`
- Production-like local run: `npm run prebuild:prod-env && npm run build` then `npm run start`
  - For standalone CSP validation, export `CSP_CONNECT_SRC`, `CSP_STYLE_SRC`, and `NEXT_PUBLIC_API_BASE_URL` before the build step.
  - Set `EXPECT_CROSS_ORIGIN_API=true` when the deployment is intentionally cross-origin so the prebuild gate fails fast if required values are missing.

```bash
npm run dev
```

Open: http://localhost:3000

- `npm run build`
- `npm run start` (requires build artifacts: `.next/standalone`)
- `npm run test`
- `npm run lint`
- `npm run format`
- `npm run format:check`

### Read this first (in order)

1. `docs/AGENT_GUIDE.md`
2. `docs/ROUTES.md`
3. `docs/FRONTEND_API_CONTRACT.md`
4. `docs/SSE_MODEL.md`
5. `docs/DESIGN_SYSTEM.md`
6. `docs/style/README.md` for any UI/layout/theme work

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
  - Explicit note: Do not add admin/dev-only API routes to user-facing frontend services unless product scope is formally updated.
- **Web-owned:** `src/lib/query/*`, React hooks, and browser adapters such as `webAuthSessionAdapter`.
- **Mobile-owned (future):** a mobile adapter layer can consume `src/lib/api/*` directly, providing mobile-specific auth/session/storage adapters without importing `src/lib/query/*`.

## Runtime topology (AWS EC2)

`Route53 -> ALB (TLS termination) -> EC2 ASG -> Next.js standalone container (port 4173)`

Health endpoints for ALB target group checks:

- `/health` (liveness)
- `/ready` (readiness)

See: `docs/deploy/aws-ec2.md`

### Proxy trust and forwarded header handling

- `TRUSTED_PROXY_CIDRS` is a comma-separated CIDR allowlist for the immediate ingress source (ALB/reverse proxy).
- Trust source resolution order: `request.ip` first (platform-provided), otherwise the right-most IP in `x-forwarded-for`.
- `forwarded`, `x-forwarded-for`, `x-forwarded-host`, `x-forwarded-port`, and `x-forwarded-proto` are accepted only when the source is trusted.
- If the source is untrusted, middleware strips both `Forwarded` and `x-forwarded-*` headers before downstream processing/logging and emits `message=untrusted_forwarded_headers`.
- Malformed CIDR entries are ignored (fail-closed), and middleware emits `message=invalid_trusted_proxy_cidrs` listing invalid entries.

## Contracts (do not invent API)

This repo is contract-driven. These are authoritative:

- `contracts/openapi.snapshot.json` (pinned schema snapshot)
- `docs/FRONTEND_API_CONTRACT.md` (behavior notes + screen mapping)

Validate these paths in CI (or locally) with:

- `npm run contracts:check`
- Before changing route-level rendering for API-backed screens (`/dashboard`, `/search`, `/alerts`, `/watchlist`, `/notifications`, `/integrations`, `/settings/profile`, `/settings/alerts`), confirm transport shapes in `docs/FRONTEND_API_CONTRACT.md` and align `src/lib/api/domains/*` + query hooks first (contract-first, then UI).

## Dev commands (expected)

- `npm run env:check:template` (pre-flight: verifies `.env.example` stays aligned with `src/config/env.ts`)
- `npm run dev`
- `npm run build`
- `npm run start` (requires build artifacts: `.next/standalone`)
- `npm run test`
- `npm run lint`
- `npm run format`

(Exact scripts depend on repo package.json; keep docs aligned with the repo.)

## Route matrix

Status criteria used in this matrix:

- `scaffold`: route exists, but is still placeholder-first (including synthetic state toggles via URL/search params) and does not yet use real API wiring.
- `wired-minimum`: route uses real TanStack Query hooks and/or mutations connected to the API client, with baseline form validation and pending/error handling.
- `production-ready`: route has complete UX polish, robust error/retry flows, accessibility coverage, and automated tests.
- `redirect`: route exists only to preserve compatibility and immediately forwards to the canonical destination.
- `planned`: documented future scope only; route is not present in `app/`.

| Route                      | Status           | Notes                                                                                                                                                                              |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                        | redirect         | Server entrypoint that forwards to `/dashboard`.                                                                                                                                   |
| `/dashboard`               | production-ready | Signed-in landing page with live query-backed metrics/previews (alerts, watchlist matches, notifications), plus loading/empty/error/rate-limited states and retry actions.         |
| `/search`                  | production-ready | Search and save-alert flows now use shared state primitives (`StateLoading`, `StateEmpty`, `StateError`, `StateRateLimited`), shared control primitives, and route-level coverage. |
| `/alerts`                  | production-ready | Full query UX states with retry actions (including cooldown handling) and route-level success/failure tests.                                                                       |
| `/alerts/new`              | production-ready | Full setup/create UX states, validation/pending feedback, and route-level success/failure tests.                                                                                   |
| `/alerts/[id]`             | production-ready | Full detail/edit/delete UX states, retry behavior, and route-level success/failure tests.                                                                                          |
| `/watchlist`               | production-ready | Full loading/empty/error/rate-limited behavior with explicit retry/cooldown actions and route-level tests.                                                                         |
| `/watchlist/[id]`          | production-ready | Canonical watchlist item detail/editor with API-backed load + save, inline validation, and destructive-confirm dialog flow for disable actions.                                    |
| `/notifications`           | production-ready | Full feed/mutation UX states, retry/cooldown behavior, and route-level success/failure tests.                                                                                      |
| `/integrations`            | production-ready | Full Discogs integration UX with retry/cooldown handling and route-level success/failure tests.                                                                                    |
| `/settings`                | production-ready | Shared settings directory shell with tested section cards and integrations handoff aligned to the final UI.                                                                        |
| `/settings/profile`        | production-ready | Profile settings now use shared loading/empty/error/rate-limited primitives, shared form controls, and route-level success/failure coverage.                                       |
| `/settings/alerts`         | production-ready | Full settings UX states, validation/pending/success handling, cooldown-aware retries, and route-level tests.                                                                       |
| `/settings/danger`         | production-ready | Two-card danger zone (deactivate + permanent delete) with explicit destructive-confirm dialogs and grouped request-status feedback.                                                |
| `/settings/integrations`   | redirect         | Legacy compatibility route that immediately redirects to `/integrations` (no standalone settings-integrations UI).                                                                 |
| `/login`                   | production-ready | First-party credential sign-in screen with secure mobile handoff validation and cooldown-aware error states.                                                                       |
| `/signed-out`              | production-ready | Centered account-state confirmation page with preserved login handoff context and route-level coverage.                                                                            |
| `/account-removed`         | production-ready | Centered account-removal confirmation page with preserved login handoff context and route-level coverage.                                                                          |
| `/admin/provider-requests` | planned          | Admin-only route; not yet present in `app/`.                                                                                                                                       |
| marketing landing          | planned          | Deferred signed-out marketing surface; not part of the current tree.                                                                                                               |
| how it works               | planned          | Deferred signed-out marketing surface; not part of the current tree.                                                                                                               |
| pricing                    | planned          | Deferred signed-out marketing surface; not part of the current tree.                                                                                                               |

### How to pick next work

Prioritize routes marked `scaffold` first, especially routes still driven by synthetic state switches or placeholder content. Converting these to `wired-minimum` closes the biggest delivery gap. After that, move `wired-minimum` routes toward `production-ready` by adding end-to-end UX polish, retry behavior, accessibility validation, and automated tests.

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

If you are a code agent, read **docs/AGENT_GUIDE.md** first. For UI/layout/theming tasks, also read **docs/style/README.md** and the relevant `docs/style/*` specs before implementing changes. Before every commit intended for a PR, run Prettier (`npm run format` or targeted `npx prettier --write ...`) and verify with `npm run format:check`; the repository pre-commit hook also runs `lint-staged`.
