## Summary

- Describe what changed and why.

## Validation checklist

- [ ] Added or updated tests for every behavior change.
- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npm run test:coverage`


## SSE merge requirements (only if this PR touches SSE behavior)

Reference: `docs/SSE_MODEL.md` -> **SSE done criteria**

- [ ] Requests include `Authorization: Bearer <jwt>` and `Accept: text/event-stream`.
- [ ] Client keeps a singleton SSE connection per authenticated session.
- [ ] Reconnect uses exponential backoff with jitter after transient disconnects.
- [ ] Reconnect stops when auth token is missing or server returns 401/403.

## Risk and rollout

- [ ] Low risk
- [ ] Requires special rollout steps (describe below)

## Notes

- Any follow-up tasks or known limitations.
