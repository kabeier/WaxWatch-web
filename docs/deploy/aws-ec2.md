# AWS EC2 Production Deployment (Platform Hardening)

## Runtime Topology

`Internet -> Route53 -> AWS ALB (TLS termination) -> EC2 Auto Scaling Group -> Next.js standalone container -> app routes`

- TLS terminates at the ALB listener (`443`).
- ALB forwards HTTP (`x-forwarded-proto=https`, `x-forwarded-for`, `x-forwarded-port`) to the EC2 target group.
- Instances run the Dockerized Next.js standalone server on port `4173`.
- Target group health checks:
  - Liveness: `GET /health`
  - Readiness: `GET /ready`

## Forwarded Headers and Cookie Security

- AWS ALB injects `X-Forwarded-*`; app middleware preserves and propagates `x-request-id` for correlation.
- Session/auth cookies must be set with:
  - `Secure=true` when `x-forwarded-proto=https`
  - `HttpOnly=true`
  - `SameSite=Lax` (or `Strict` for admin-only flows)
- Never rely on local instance memory for session state; use external state stores.

## Secrets and Environment Injection

Use either:
1. **SSM Parameter Store** (recommended for standard secret counts), or
2. **AWS Secrets Manager** (rotation-heavy credentials).

Runtime flow:
1. CI/CD assumes deploy role.
2. Deploy step fetches secrets by prefix (example: `/waxwatch/prod/web/*`).
3. Values are injected into instance environment (`/etc/waxwatch/web.env`) via cloud-init/SSM RunCommand.
4. `docker compose up -d` reads `.env`/`env_file` and starts app.
5. Startup validation (`scripts/env-contract.mjs`) fails the deploy immediately when required values are missing/malformed.

## Patch and Base Image Cadence

- **AMI patching cadence**: at least monthly (or immediate for critical CVEs).
- **Container base image cadence**: rebuild from latest `node:20-alpine` weekly.
- Dependabot/security updates should be reviewed within 48h for critical runtime deps.

## Autoscaling-Safe Assumptions

- App is stateless.
- No local disk session/cache dependency.
- All instances can be terminated at any time without data loss.
- Graceful shutdown is enabled to drain in-flight requests during rolling deployments.

## Incident Readiness / Runbook Alarms

Recommended CloudWatch alarm thresholds:
- ALB `HTTPCode_Target_5XX_Count` > 2% over 5m.
- ALB `TargetResponseTime` p95 > 1.5s over 5m.
- `UnHealthyHostCount` >= 1 for 2 consecutive periods.
- Application log `level=error` burst above baseline.

Response checklist:
1. Confirm `/health` and `/ready` from ALB path.
2. Check latest deployment verification output.
3. Inspect structured logs filtered by `requestId`.
4. Review centralized error events (client + server).
5. Roll back to prior AMI/image if regression confirmed.
