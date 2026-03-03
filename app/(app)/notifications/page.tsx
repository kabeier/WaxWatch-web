"use client";

import { routeViewModels } from "@/lib/view-models/routes";
import { useNotificationsQuery, useUnreadNotificationCountQuery } from "@/lib/query/hooks";

export default function NotificationsPage() {
  const viewModel = routeViewModels.notifications;
  const notificationsQuery = useNotificationsQuery();
  const unreadCountQuery = useUnreadNotificationCountQuery();

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      <p>Unread notifications: {unreadCountQuery.data?.unreadCount ?? 0}</p>

      {notificationsQuery.isLoading ? <p>Loading notifications…</p> : null}
      {notificationsQuery.isError ? <p>Could not load notifications.</p> : null}
      {!notificationsQuery.isLoading && !notificationsQuery.isError && notificationsQuery.data ? (
        notificationsQuery.data.items.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          <ul>
            {notificationsQuery.data.items.map((notification) => (
              <li key={notification.id}>{notification.message}</li>
            ))}
          </ul>
        )
      ) : null}
      <button type="button">Retry notifications feed</button>
      <button type="button">Mark selected as read</button>
    </section>
  );
}
