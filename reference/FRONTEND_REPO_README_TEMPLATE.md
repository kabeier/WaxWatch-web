# WaxWatch Web Template

TypeScript + React application built with Next.js (Pages Router), hardened for EC2 production rollouts.

## Production Topology (AWS EC2)

`ALB/ELB (TLS termination) -> EC2 instances (ASG) -> Next.js standalone runtime`

- TLS terminates on the ALB.
- ALB forwards traffic to containerized Next.js on port `4173`.
- Security headers are applied by Next.js (`next.config.mjs`) in the live serving path.
- Health endpoints exposed for target-group checks:
  - `/health` (liveness)
  - `/ready` (readiness)

See full deployment guide: [`docs/deploy/aws-ec2.md`](docs/deploy/aws-ec2.md).

## Environment Contract

Copy `.env.example` to `.env` and fill all values.

```bash
cp .env.example .env
npm run build
```

Validation runs before build/start and fails fast if env values are missing/malformed. Template parity is enforced by `npm run env:check:template`, which keeps `.env.example` aligned with the runtime contract in `src/config/env.ts`.

## Core Scripts

- `npm run dev` - local development
- `npm run build` - production build (with env validation)
- `npm run start` - starts standalone server wrapper with graceful shutdown
- `npm run test:coverage` - unit tests + coverage thresholds
- `npm run format:check` - verifies Prettier formatting
- `npm run format:check:changed` - checks formatting for changed files in PR CI
- `npm run test:contract` - enforces test updates when production code changes in PRs
- `npm run a11y:smoke` - accessibility smoke checks
- `npm run bundle:check` - bundle-size budget enforcement
- `npm run verify:deployment` - checks required response headers and health endpoints

## Container Runtime Hardening

- Next.js standalone output (`output: 'standalone'`)
- Non-root runtime user in Docker image
- Docker `HEALTHCHECK` against `/health`
- Restart policy (`unless-stopped`) in compose
- Graceful shutdown handling for `SIGTERM`/`SIGINT`

## Observability

- Structured JSON logs for CloudWatch ingestion
- `x-request-id` propagation via middleware
- Client/server error capture hooks for centralized tracking pipeline

## CI/CD Production Gates

CI enforces:

- typecheck + lint + format checks
- PR test-update contract for production code changes
- coverage thresholds
- a11y smoke test
- env template parity check (`.env.example` vs runtime contract)
- build + bundle budget
- deployment verification (`headers + /health + /ready`)

## Release Checklist (Template Cleanup)

Before each release:

1. Confirm **WaxWatch** naming consistency (repo/docs/UI).
2. Remove leftover template placeholders and references.
3. Run `npm run env:check:template` to verify `.env.example` matches runtime contract.
4. Run `npm run ci:prod-gates`.
5. Confirm deployment runbook updates if architecture changed.
