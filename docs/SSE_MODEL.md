# Realtime (SSE)

Endpoint:

- `GET /api/stream/events`

Event name:

- `notification`

Auth:

- Canonical web mode is **cookie/session auth** for SSE: send `credentials: include` and do not require an `Authorization` header when using the web adapter.
- Optional bearer header remains supported for non-web adapters/clients, but web must not depend on JS-managed long-lived tokens.
- Use a fetch/ReadableStream SSE client (instead of native `EventSource`) so request credentials and headers are explicitly controlled.
- For canonical auth lifecycle and adapter behavior, see [Auth Model](./AUTH_MODEL.md).

Recommended client behavior:

- connect once per authenticated session
- reconnect with exponential backoff
- on event:
  - invalidate/refetch `notifications:unreadCount`
  - optionally refresh inbox list

Failure behavior:

- Web cookie-mode: stop reconnect attempts on `401/403`.
- Optional bearer adapters: may also stop reconnect when a required bearer token is unavailable.

## SSE done criteria

Before merging SSE-related changes, verify all of the following:

- [ ] Web requests include `credentials: include` and `Accept: text/event-stream`.
- [ ] Web SSE flow works when `Authorization` header is omitted.
- [ ] Client maintains a singleton SSE connection per authenticated app session.
- [ ] Reconnect uses exponential backoff with jitter after disconnects/non-auth transient failures.
- [ ] In web cookie-mode SSE, reconnect stops immediately on `401/403` and does not depend on bearer token presence.
- [ ] Optional (non-web/bearer adapters): reconnect may stop when a required bearer token is unavailable.
