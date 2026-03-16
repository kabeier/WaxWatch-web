# Realtime (SSE)

Endpoint:

- `GET /api/stream/events`

Event name:

- `notification`

Auth:

- Canonical web mode is **cookie/session auth** for SSE: send `credentials: include` and do not require an `Authorization` header when using the web adapter.
- Optional bearer header remains supported for non-web adapters/clients, but web must not depend on JS-managed long-lived tokens.
- Use a fetch/ReadableStream SSE client (instead of native `EventSource`) so request credentials and headers are explicitly controlled.

Recommended client behavior:

- connect once per authenticated session
- reconnect with exponential backoff
- on event:
  - invalidate/refetch `notifications:unreadCount`
  - optionally refresh inbox list

Failure behavior:

- If the server returns 401/403 or auth is missing, stop reconnect attempts.

## SSE done criteria

Before merging SSE-related changes, verify all of the following:

- [ ] Web requests include `credentials: include` and `Accept: text/event-stream`.
- [ ] Web SSE flow works when `Authorization` header is omitted.
- [ ] Client maintains a singleton SSE connection per authenticated app session.
- [ ] Reconnect uses exponential backoff with jitter after disconnects/non-auth transient failures.
- [ ] Reconnect stops immediately when auth token is missing or server responds with 401/403.
