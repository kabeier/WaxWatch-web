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
