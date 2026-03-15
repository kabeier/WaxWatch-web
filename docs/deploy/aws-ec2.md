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

- AWS ALB injects `X-Forwarded-*`; middleware accepts `Forwarded` and `X-Forwarded-*` headers **only** when the immediate source IP is in `TRUSTED_PROXY_CIDRS`.
- Source IP trust resolution is: `request.ip` (platform field) first, otherwise the right-most IP in `x-forwarded-for` (closest hop).
- When source IP is untrusted, middleware strips `forwarded`, `x-forwarded-for`, `x-forwarded-host`, `x-forwarded-port`, and `x-forwarded-proto` before downstream processing/logging and emits a structured warning (`message=untrusted_forwarded_headers`).
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

### Readiness threshold environment variable

- `READY_MIN_UPTIME_SECONDS` controls when `GET /ready` can return `200` based on process uptime.
- Accepted format: a non-negative integer string in seconds (for example: `0`, `5`, `30`).
- Invalid values fall back safely to `5` seconds, including:
  - empty strings,
  - non-numeric values,
  - `NaN`, `Infinity`, `-Infinity`,
  - negative values,
  - decimal values (for example `0.5`).

## Content Security Policy (CSP) for Cross-Origin APIs

WaxWatch uses a **build-time CSP model** for Next.js standalone output.

- CSP directives are assembled in `next.config.mjs`.
- `CSP_CONNECT_SRC`, `CSP_STYLE_SRC`, and `NEXT_PUBLIC_API_BASE_URL` are evaluated during `npm run build` and baked into emitted headers.
- Runtime-only environment changes do not alter CSP unless you rebuild the image/artifact.

The app always emits a strict CSP:

- `connect-src` starts with same-origin (`'self'`) and only allows explicit trusted API origins.
- `style-src` is `'self'` plus optional explicit trusted style origins from `CSP_STYLE_SRC`.
- `style-src` must never include `'unsafe-inline'` in production. Inline styles are not allowed; move UI styling to stylesheet classes.

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
# Optional: only if you intentionally load third-party hosted stylesheets
CSP_STYLE_SRC=https://fonts.googleapis.com
```

If your frontend stays same-origin (recommended default with reverse proxy), leave `CSP_CONNECT_SRC` unset and keep `NEXT_PUBLIC_API_BASE_URL=/api`.

Build pipeline requirement for standalone images:

- Provide `CSP_CONNECT_SRC`, `CSP_STYLE_SRC`, and `NEXT_PUBLIC_API_BASE_URL` in CI/CD or Docker build args before `npm run build`.
- Run `npm run prebuild:prod-env` immediately before `npm run build` in the production pipeline.
- Treat CSP envs as build inputs, not runtime-only knobs.
  Exact production build step:

```bash
NODE_ENV=production EXPECT_CROSS_ORIGIN_API=true npm run prebuild:prod-env
npm run build
```

For same-origin deployments, omit `EXPECT_CROSS_ORIGIN_API` (or set it to `false`) and keep `NEXT_PUBLIC_API_BASE_URL=/api`.

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

### CSP style exceptions process

If a team needs a new `style-src` allowlist entry:

1. Open a security review ticket with justification, data classification, and owner.
2. Confirm there is no inline-style dependency (`style=`, CSS-in-JS runtime injection, or library fallback to inline style attributes).
3. Add only explicit HTTPS origins to `CSP_STYLE_SRC` (no wildcards), deploy to staging, and run `scripts/verify-deployment.mjs` with `VERIFY_ENVIRONMENT=production`.
4. Document the approved origin and expiry/revisit date in the deployment change record.
