# Realtime (SSE)

Endpoint:
- `GET /api/stream/events`

Event name:
- `notification`

Recommended client behavior:
- connect once per authenticated session
- reconnect with exponential backoff
- on event:
  - invalidate/refetch `notifications:unreadCount`
  - optionally refresh inbox list

Failure behavior:
- If the server returns 401/403 or auth is missing, stop reconnect attempts.
