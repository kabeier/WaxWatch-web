# Realtime (SSE)

Endpoint:

- `GET /api/stream/events`

Event name:

- `notification`

Auth:

- Requires `Authorization: Bearer <jwt>` (same as other `/api/**` routes).
- Because the stream requires auth headers, use a fetch/ReadableStream SSE client instead of native `EventSource`.

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

- [ ] Requests include `Authorization: Bearer <jwt>` and `Accept: text/event-stream`.
- [ ] Client maintains a singleton SSE connection per authenticated app session.
- [ ] Reconnect uses exponential backoff with jitter after disconnects/non-auth transient failures.
- [ ] Reconnect stops immediately when auth token is missing or server responds with 401/403.
