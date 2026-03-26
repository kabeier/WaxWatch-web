# Agent Guide (WaxWatch Frontend)

This document is the “rules of engagement” for human contributors and code agents.

## Non-negotiables

1. **Do not invent API endpoints or fields**
   - The source of truth is:
     - `contracts/openapi.snapshot.json`
     - `docs/FRONTEND_API_CONTRACT.md`
   - If either file is moved, update docs and `scripts/check-contract-doc-paths.mjs` in the same PR.
2. **Use platform-authenticated API transport (no third-party token-storage assumptions)**
   - **Web:** backend-managed `httpOnly` session cookies (`credentials: include`).
   - **Mobile/native:** `Authorization: Bearer <jwt>`.
   - Canonical web implementation anchors: `app/(auth)/login/LoginPageClient.tsx` and `src/lib/auth-session.ts`.
3. **Every screen implements 4 states**
   - Loading, Empty, Error, Rate-limited (429 + Retry-After)
4. **No ad-hoc fetch**
   - Use the shared API client wrapper only.
5. **Server state lives in TanStack Query**
   - Don’t mirror server state into global stores (except small UI-only state).
6. **SSE is a singleton**
   - One connection per authenticated session at the app shell level.
7. **UI work must follow the style docs stack**
   - For any app UI, layout, theming, or shared component change, read `docs/style/README.md` and the referenced `docs/style/*` files before coding.
   - Reuse WaxWatch tokens, shell/page specs, and the `WaveTrace` rules instead of inventing new visual patterns.
8. **Formatting is mandatory for every PR**
   - Run `npm run format` (or targeted `npx prettier --write ...`) before committing.
   - Verify with `npm run format:check` (and `npm run format:check:changed` in CI contexts).
   - `git commit` also runs `.husky/pre-commit` with `lint-staged`; do not bypass it for agent-authored changes.
   - **All AI/code agents must Prettier-format PR changes before submission.**

## Required reading before implementation

### For every task

1. `docs/DEVELOPER_REFERENCE.md` (workflow + route status context)
2. `docs/ROUTES.md`
3. `docs/FRONTEND_API_CONTRACT.md`
4. `docs/SSE_MODEL.md` for realtime-related work

### Additional required reads for UI/design tasks

1. `docs/DESIGN_SYSTEM.md`
2. `docs/style/README.md`
3. The specific `docs/style/*` references that match the surface being changed:
   - theme/token work -> theme/token CSS + Tailwind mapping docs
   - shell/navigation work -> `APP_SHELL_LAYOUT_SPEC.txt`
   - route/page composition work -> `PAGE_VIEW_SPECS.txt`
   - waveform usage -> `WAVETRACE_COMPONENT_SPEC.txt` + implementation references
   - component polish -> `COMPONENT_STYLE_RULES.txt`

UI contributors and agents must not start visual implementation until these documents have been reviewed.

## Project approach (Option A)

This app is a dashboard-style SPA:

- Client-side routing under an authenticated layout
- Data via TanStack Query
- Mutations invalidate/refresh relevant queries

## Required architectural pieces

### 1) Shared API client wrapper

Implement a single wrapper (example paths):

- `src/lib/api/client.ts`
- `src/lib/api/errors.ts`

Responsibilities:

- apply platform auth transport (web cookie credentials or mobile bearer token)
- parse JSON
- normalize backend error envelope
- handle 401/403 globally via auth-session adapter lifecycle (clear session/event/redirect)
- handle 429 globally (honor Retry-After)

### 2) Query keys + invalidation

Define query keys centrally:

- `me`
- `watchRules:list`
- `watchRules:detail:<id>`
- `watchReleases:list`
- `notifications:list`
- `notifications:unreadCount`
- `integrations:discogs:status`
- `integrations:discogs:importJob:<job_id>`
- `search:results:<stableHashOfQuery>`

### 3) SSE event bridge

At app shell:

- connect to `/api/stream/events`
- on `notification` event:
  - refresh unread count
  - optionally refetch inbox or merge minimal payload

Reconnect policy:

- exponential backoff with jitter
- stop reconnecting if auth is missing
- validate all SSE merge requirements using the checklist in `docs/SSE_MODEL.md` before submitting changes

## UX rules by feature

### Search

- User searches
- Show results (even if partial provider failures occurred)
- Show non-blocking warnings if `provider_errors` returned
- “Save this search as alert” works whether results are empty or non-empty

### Alerts

- CRUD watch rules (`/api/watch-rules`)
- Query sources must only include enabled provider keys (from `/api/me` integrations list)

### Discogs import

- tolerate “same job_id” returned on repeated import clicks
- if import queue fails (503), show retry CTA; continue to poll job if a job_id exists

### Outbound redirect

- `/api/outbound/ebay/{listing_id}` returns 307 redirect
- open in new tab; do not append affiliate params client-side

## What agents must not do

- Build “admin UI” unless explicitly asked and gated behind:
  - admin claim checks AND
  - a feature flag
- Introduce new providers/values client-side outside the contract
- Add new design tokens without updating the design guide docs

## PR contributor checklist (design-system guardrails)

Before opening a PR, confirm all items:

- [ ] No hardcoded design values (spacing, color, typography, radius) when a shared token equivalent exists in `docs/DESIGN_SYSTEM.md` or `docs/style/WAXWATCH_THEME_TOKENS.txt`.
- [ ] Any UI/layout change reviewed `docs/style/README.md` plus the relevant `docs/style/*` specs before implementation.
- [ ] Route/page state UI uses shared primitives from `src/components/ui/primitives/state` for loading, empty, error, and rate-limited states.
- [ ] Shell/layout work reuses shared primitives from `src/components/ui/primitives/shell` (`AppShell`, `TopNav`, `SideNav`, `ContentContainer`) instead of ad-hoc wrappers.
- [ ] If this PR implements new design-guide input, `docs/DESIGN_GUIDE_INTAKE_CHECKLIST.md` is completed and attached in the PR description.
- [ ] Design-guide migration sequence is respected: tokens -> shared primitives -> route pages -> cleanup deprecated temporary mappings.
- [ ] Prettier has been run before commit (`npm run format` or targeted `npx prettier --write ...`), and formatting passes `npm run format:check`.

## Route status matrix + promotion criteria

- The canonical route status matrix and status definitions (`scaffold`, `wired-minimum`, `production-ready`) live in `docs/DEVELOPER_REFERENCE.md` under **Route matrix**.
- Promotion evidence requirements (including route-level test updates) also live in `docs/DEVELOPER_REFERENCE.md` under **Route matrix status-change workflow (PR requirement)**.
- `README.md` intentionally stays high-level; do not add route-level promotion gates there.
