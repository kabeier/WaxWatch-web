"use client";

import { StateEmpty } from "@/components/StateEmpty";
import { StateError } from "@/components/StateError";
import { StateLoading } from "@/components/StateLoading";
import { StateRateLimited } from "@/components/StateRateLimited";
import { useNotificationsQuery, useUnreadNotificationCountQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function NotificationsPage() {
  const viewModel = routeViewModels.notifications;
  const notificationsQuery = useNotificationsQuery();
  const unreadCountQuery = useUnreadNotificationCountQuery();

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>
      <p>Unread notifications: {unreadCountQuery.data?.unreadCount ?? 0}</p>

      {notificationsQuery.isLoading ? <StateLoading message="Loading notifications…" /> : null}
      {notificationsQuery.isError && isRateLimitedError(notificationsQuery.error) ? (
        <StateRateLimited
          message={notificationsQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(notificationsQuery.error)}
        />
      ) : null}
      {notificationsQuery.isError && !isRateLimitedError(notificationsQuery.error) ? (
        <StateError
          message="Could not load notifications."
          detail={getErrorMessage(notificationsQuery.error, "Request failed")}
        />
      ) : null}
      {notificationsQuery.data && notificationsQuery.data.items.length === 0 ? (
        <StateEmpty message="No notifications yet." />
      ) : null}
      {notificationsQuery.data && notificationsQuery.data.items.length > 0 ? (
        <ul>
          {notificationsQuery.data.items.map((notification) => (
            <li key={notification.id}>{notification.message}</li>
          ))}
        </ul>
      ) : null}
      <button type="button">Retry notifications feed</button>
      <button type="button">Mark selected as read</button>
    </section>
  );
}
