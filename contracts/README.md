# Contracts

Place the following in this folder (committed):

- `openapi.snapshot.json` (pinned backend schema snapshot)
- optionally: `openapi.yaml` or `openapi.json` if you maintain a non-snapshot “current” copy

Everything in the frontend should reference the snapshot to avoid drift.
