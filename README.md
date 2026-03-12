# WaxWatch Web

WaxWatch helps record collectors discover good listings faster.

Instead of manually checking marketplaces over and over, users can search for records, save alert rules, track a watchlist, and get notified when new listings match what they care about.

## What this repo is

This repository contains the **web frontend** for WaxWatch.

It focuses on the user-facing experience: search, alerts, watchlist, notifications, and account settings.

## Tech stack (high level)

- **Next.js** (React framework) for the web app
- **TypeScript** for safer, maintainable code
- **Supabase Auth** for sign-in/session handling
- **Backend API integration** for listings, alerts, watchlist, notifications, and settings
- **TanStack Query** for data fetching and caching
- **Server-Sent Events (SSE)** for realtime notification updates

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
