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

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Open: http://localhost:3000

## Dev commands (expected)

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run test`
- `npm run lint`
- `npm run format`

(Exact scripts depend on repo package.json; keep docs aligned with the repo.)

## Navigation map (MVP)

Primary routes (authenticated shell):

- `/search`
- `/alerts`
- `/watchlist`
- `/notifications`
- `/settings/profile`
- `/settings/alerts`
- `/settings/integrations`
- `/settings/danger`

See `docs/ROUTES.md` and `docs/IA_MAP.md`.

## Agent work

If you are a code agent, read **docs/AGENT_GUIDE.md** first.
