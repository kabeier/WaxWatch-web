# Backend Runtime Checks History

This document tracks backend-owned implementation details for runtime health/readiness checks.

Frontend-facing contract expectations for this repository are intentionally narrower:

- `/health` for liveness checks.
- `/ready` for readiness checks.

Frontend contract source: `docs/FRONTEND_API_CONTRACT.md`.

## Changelog (backend internals)

- `2026-03-02.0`
  - `/readyz` DB readiness timeout enforcement uses backend-agnostic `_run_with_timeout(...)` wrapping.
  - Postgres `SET LOCAL statement_timeout` remains a secondary safeguard.
  - Timeout failures surface explicit reasons (for example `db readiness probe timed out after ...`).

- `2026-02-28.5`
  - `/readyz` DB probe dialect-name normalization now handles non-string/missing dialect metadata on lightweight connection/bind doubles while preserving Postgres statement-timeout behavior.

- `2026-02-28.4`
  - `/readyz` probe compatibility hardening for test doubles that omit transaction helpers (`in_transaction()`/`begin()`).

- `2026-02-28.3`
  - `/readyz` DB probe compatibility hardening: when a connection does not expose `begin()`, the probe executes directly instead of raising attribute errors in lightweight doubles.

- `2026-02-28.2`
  - `/readyz` probe hardening: DB dialect detection supports bind-owned dialect metadata and defensive transaction-state checks for SQLAlchemy test doubles.

- `2026-02-28.1`
  - `/readyz` DB probe implementation hardening for in-thread bind/connection handling with Postgres `SET LOCAL statement_timeout`.
