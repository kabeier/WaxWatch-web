# WaxWatch Frontend (Next.js)

WaxWatch is a record-price alert web app. Users can search listings across providers, save searches as alerts, manage alerts/watchlist, and receive notifications.

## Stack (production)

- Next.js **App Router**
- TypeScript
- Supabase Auth (client session) + WaxWatch Backend API (JWT bearer)
- TanStack Query for server state (Option A: SPA-style dashboard)
- SSE for realtime notifications

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

## Quick start

```bash
cp .env.example .env
npm install
npm run env:check:template
npm run dev
```

Minimum local values are already provided in `.env.example` (for example: `NODE_ENV=development`, `APP_BASE_URL=http://localhost:3000`, and local-safe placeholders for Sentry/AWS keys). Keep these keys present because `src/config/env.ts` requires all of them at runtime.

For production deployments, replace placeholder/template values with environment-specific secrets and infrastructure values (especially `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `AWS_SECRETS_PREFIX`, and `TRUSTED_PROXY_CIDRS`).

Open: http://localhost:3000

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
| `/settings/profile`        | wired-minimum    | Uses real query hook (`useMeQuery`) via API client.                                                           |
| `/settings/alerts`         | production-ready | Full settings UX states, validation/pending/success handling, cooldown-aware retries, and route-level tests.  |
| `/settings/integrations`   | wired-minimum    | Uses real query hook (`useDiscogsStatusQuery`) via API client.                                                |
| `/settings/danger`         | production-ready | Full danger-zone UX states with robust pending/success/error handling and route-level success/failure tests.  |
| `/signed-out`              | scaffold         | Static confirmation page exists; no API wiring or production-hardening checks yet.                            |
| `/account-removed`         | scaffold         | Static confirmation page exists; no API wiring or production-hardening checks yet.                            |
| `/admin/provider-requests` | planned          | Admin-only route; not yet present in `app/`.                                                                  |

### How to pick next work

Prioritize routes marked `scaffold` first, especially routes still driven by synthetic state switches. Converting these to `wired-minimum` (real hooks/mutations through the API client) closes the biggest delivery gap. After that, move `wired-minimum` routes toward `production-ready` by adding end-to-end UX polish, retry behavior, accessibility validation, and automated tests.

See `docs/ROUTES.md` and `docs/IA_MAP.md`.

## Agent work

If you are a code agent, read **docs/AGENT_GUIDE.md** first.
