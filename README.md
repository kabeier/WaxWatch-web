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

| Route                      | Status      | Notes                                                                               |
| -------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `/`                        | implemented | Redirects to `/search`.                                                             |
| `/login`                   | scaffold    | Sign-in shell placeholder for Supabase auth UI.                                     |
| `/search`                  | implemented | Search route now includes explicit loading/empty/error/rate-limited render states.  |
| `/alerts`                  | implemented | Watch rules/releases route now renders loading/empty/error/rate-limited states.     |
| `/alerts/new`              | implemented | Create-alert route now includes explicit loading/empty/error/rate-limited branches. |
| `/alerts/[id]`             | implemented | Alert detail route now includes explicit loading/empty/error/rate-limited branches. |
| `/watchlist`               | implemented | Watchlist route now renders loading/empty/error/rate-limited states.                |
| `/notifications`           | implemented | Notifications route now renders loading/empty/error/rate-limited states.            |
| `/settings/profile`        | implemented | Profile settings now render loading/empty/error/rate-limited states.                |
| `/settings/alerts`         | implemented | Alert settings route now includes loading/empty/error/rate-limited branches.        |
| `/settings/integrations`   | implemented | Integrations route now renders loading/empty/error/rate-limited states.             |
| `/settings/danger`         | implemented | Danger-zone route now includes loading/empty/error/rate-limited branches.           |
| `/signed-out`              | implemented | Signed-out confirmation support route.                                              |
| `/account-removed`         | implemented | Account removal confirmation support route.                                         |
| `/admin/provider-requests` | planned     | Admin-only route; not yet present in `app/`.                                        |

See `docs/ROUTES.md` and `docs/IA_MAP.md`.

## Agent work

If you are a code agent, read **docs/AGENT_GUIDE.md** first.
