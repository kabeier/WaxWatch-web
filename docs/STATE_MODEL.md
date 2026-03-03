# State Model

## Server state (TanStack Query)

All backend-derived state lives in the query cache:
- `/api/me` (profile + integrations summary)
- search results
- watch rules list/detail
- watch releases list/detail
- notifications list + unread count
- discogs status/import jobs/imported items
- provider request list/summary (if enabled)

## Client/UI-only state

UI-only state can be local component state or a tiny store:
- open/closed modals
- search form input draft values
- currently selected tab
- toasts

Avoid duplicating server state into a separate global store.

## SSE bridge

SSE is global:
- Keep a single EventSource connection under the authenticated layout.
- On incoming `notification` event:
  - refresh unread count
  - optionally refetch inbox list (or merge if you keep normalized cache)
