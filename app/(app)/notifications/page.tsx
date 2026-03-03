const NOTIFICATION_ENDPOINTS = {
  list: "GET /api/notifications",
  unreadCount: "GET /api/notifications/unread-count",
  markRead: "PATCH /api/notifications/:id/read",
  markUnread: "PATCH /api/notifications/:id/unread",
  stream: "GET /api/notifications/stream (SSE)",
} as const;

export default function NotificationsPage() {
  return (
    <section>
      <h1>Notifications Scaffold</h1>
      <p>Endpoint capability mapping for list/read/unread count + SSE readiness:</p>
      <ul>
        {Object.values(NOTIFICATION_ENDPOINTS).map((endpoint) => (
          <li key={endpoint}>
            <code>{endpoint}</code>
          </li>
        ))}
      </ul>

      <h2>Notifications List</h2>
      <p>Loading state: request notification feed from {NOTIFICATION_ENDPOINTS.list}.</p>
      <p>Empty state: no notifications available.</p>
      <p>Error state: failed to load notifications list.</p>
      <button type="button">Placeholder: Retry notifications list fetch</button>

      <h2>Read/Unread Actions</h2>
      <p>Action scaffold: toggle read status with optimistic UI placeholder behavior.</p>
      <p>Error state: rollback and message when read/unread update fails.</p>
      <button type="button">Placeholder: Mark selected as read</button>
      <button type="button">Placeholder: Mark selected as unread</button>

      <h2>Unread Count</h2>
      <p>Loading state: fetch unread badge count from {NOTIFICATION_ENDPOINTS.unreadCount}.</p>
      <p>Error state: unread count unavailable; fallback to list-derived count.</p>

      <h2>SSE Readiness</h2>
      <p>Connection state placeholder: disconnected / connecting / open / errored.</p>
      <p>SSE endpoint mapping: {NOTIFICATION_ENDPOINTS.stream}</p>
      <button type="button">Placeholder: Connect SSE stream</button>
      <button type="button">Placeholder: Disconnect SSE stream</button>
    </section>
  );
}
