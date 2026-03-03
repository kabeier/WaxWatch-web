# Error Handling

## Backend error envelope

All failures (validation/HTTP/rate-limit) follow:

- `error.message`
- `error.code`
- `error.status`
- `error.details` (optional)

## UX guidelines

- Validation errors (422): show field-level errors when possible.
- Not found (404): show “not found” with navigation back.
- Rate limit (429): show warning + cooldown; honor Retry-After.
- Server errors (>=500): show retry CTA; log to error pipeline.
