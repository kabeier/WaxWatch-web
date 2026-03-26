# WaxWatch Web

WaxWatch helps record collectors discover good listings faster.

Instead of manually checking marketplaces over and over, users can search for records, save alert rules, track a watchlist, and get notified when new listings match what they care about.

## What this repo is

This repository contains the **web frontend** for WaxWatch.

It focuses on the user-facing experience: search, alerts, watchlist, notifications, and account settings.

## Tech stack (high level)

- **Next.js** (React framework) for the web app
- **TypeScript** for safer, maintainable code
- **Backend-managed cookie auth** (`httpOnly` sessions via `credentials: "include"`) for web sign-in/session handling
- **Backend API integration** for listings, alerts, watchlist, notifications, and settings
- **TanStack Query** for data fetching and caching
- **Server-Sent Events (SSE)** for realtime notification updates

Auth implementation anchors:

- Session adapter + auth lifecycle redirects: [`src/lib/auth-session.ts`](src/lib/auth-session.ts)
- Login submit flow (`POST /auth/login` + cookie credentials): `app/(auth)/login/LoginPageClient.tsx`

## Project goal

Build a reliable, fast, and approachable record-alert experience that helps collectors:

- spend less time refreshing pages
- catch relevant listings quickly
- manage searches and alerts with confidence

## Looking for technical docs?

Developer and implementation documentation lives in [`docs/`](docs), including the previous repository reference now in [`docs/DEVELOPER_REFERENCE.md`](docs/DEVELOPER_REFERENCE.md).

Canonical internal references:

- Route status matrix + status definitions: [`docs/DEVELOPER_REFERENCE.md#route-matrix`](docs/DEVELOPER_REFERENCE.md#route-matrix)
- Route promotion evidence requirements: [`docs/DEVELOPER_REFERENCE.md#route-matrix-status-change-workflow-pr-requirement`](docs/DEVELOPER_REFERENCE.md#route-matrix-status-change-workflow-pr-requirement)
- Agent/contributor execution rules: [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md)
- UI/style workflow index: [`docs/style/README.md`](docs/style/README.md)

## Local startup

- Copy env template: `cp .env.example .env`
- Install dependencies: `npm install`
- Validate local env contract: `npm run env:check:template`
- Development server: `npm run dev`
- Production-like local run: `npm run prebuild:prod-env && npm run build` then `npm run start` _(requires build artifacts and full env contract values)_

### API base URL configuration

The web API client reads `NEXT_PUBLIC_API_BASE_URL` and falls back to `/api` when unset.

### CSP + standalone build-time model (canonical)

WaxWatch uses a **build-time CSP model** for Next.js standalone output. CSP directives are assembled in `next.config.mjs`, so `CSP_CONNECT_SRC`, `CSP_STYLE_SRC`, and `NEXT_PUBLIC_API_BASE_URL` are evaluated during `npm run build` and baked into emitted headers.

- Build/CI pipelines must run `npm run prebuild:prod-env` immediately before `npm run build`.
- Changing these values at container runtime without rebuilding will **not** change the CSP header.

- **Same-origin (recommended default):** `NEXT_PUBLIC_API_BASE_URL=/api`
  - Browser requests go through this Next.js app origin (for example `https://app.example.com/api/*`).
- **Cross-origin API:** set a full URL such as `NEXT_PUBLIC_API_BASE_URL=https://api.example.com`
  - Browser requests go directly to that API origin.
  - Ensure CORS and auth/session behavior are configured for cross-origin traffic.
