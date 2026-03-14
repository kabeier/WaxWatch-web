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

- AWS ALB injects `X-Forwarded-*`; middleware accepts these headers **only** when the immediate source IP is in `TRUSTED_PROXY_CIDRS`.
- Source IP trust resolution is: `request.ip` (platform field) first, otherwise the right-most IP in `x-forwarded-for` (closest hop).
- When source IP is untrusted, middleware strips `x-forwarded-for`, `x-forwarded-host`, `x-forwarded-port`, and `x-forwarded-proto` before downstream processing/logging and emits a structured warning (`message=untrusted_forwarded_headers`).
- Malformed CIDR entries in `TRUSTED_PROXY_CIDRS` are ignored (fail-closed) and logged as `message=invalid_trusted_proxy_cidrs`; only valid CIDRs are used for trust checks.
- Web session/auth cookies are the primary browser auth mechanism and must be set with:
  - `Secure=true` only when `x-forwarded-proto=https` survived middleware trust checks (trusted proxy source).
  - `Secure=true` must **not** be enabled from raw forwarded headers on untrusted requests; treat missing/stripped `x-forwarded-proto` as HTTP (fail-closed).
  - `HttpOnly=true`
  - `SameSite=Lax` (or `Strict` for admin-only flows)
- Do not rely on browser `localStorage` bearer tokens for web API authorization; keep bearer usage limited to non-browser clients/mobile SDK flows.
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

## Content Security Policy (CSP) for Cross-Origin APIs

The app always emits a strict CSP and `connect-src` starts with same-origin (`'self'`).

For deployments where the browser calls a cross-origin API directly:

- Set `CSP_CONNECT_SRC` to a comma-separated list of **absolute origins** (scheme + host + optional port), for example: `https://api.your-backend.example,https://api-failover.your-backend.example`.
- `NEXT_PUBLIC_API_BASE_URL` is also parsed and its origin is automatically added to `connect-src` when absolute.
- Validation rules at startup/build time:
  - No wildcard (`*`) entries.
  - Origins must be absolute URLs.
  - Non-local entries must be HTTPS in production.
  - Local development may use `http://localhost:<port>` / `http://127.0.0.1:<port>`.

Recommended production configuration:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.your-backend.example/api
CSP_CONNECT_SRC=https://api.your-backend.example
```

If your frontend stays same-origin (recommended default with reverse proxy), leave `CSP_CONNECT_SRC` unset and keep `NEXT_PUBLIC_API_BASE_URL=/api`.

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
