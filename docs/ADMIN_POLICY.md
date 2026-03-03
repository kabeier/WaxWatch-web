# Admin Policy

Default: **No admin UI in MVP**.

Backend provides admin-only provider-request endpoints that are claim/role gated.
If an admin surface is added later, it must be:

1. Behind a feature flag (env var), default off
2. Behind an admin-claim guard
3. Isolated under `/admin/*` layout group

Do not expose admin-only endpoints or data in the user UI.
