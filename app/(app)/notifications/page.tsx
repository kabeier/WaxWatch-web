"use client";

import {
  Page,
  PageActions,
  PageHeader,
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/primitives";
import { useNotificationsQuery, useUnreadNotificationCountQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function NotificationsPage() {
  const viewModel = routeViewModels.notifications;
  const notificationsQuery = useNotificationsQuery();
  const unreadCountQuery = useUnreadNotificationCountQuery();

  return (
    <Page>
      <PageHeader title={viewModel.heading} summary={viewModel.summary} />
      <p>Unread notifications: {unreadCountQuery.data?.unread_count ?? 0}</p>

      {notificationsQuery.isLoading ? <StateLoading message="Loading notifications…" /> : null}
      {notificationsQuery.isError && isRateLimitedError(notificationsQuery.error) ? (
        <StateRateLimited
          title="Notifications are temporarily rate limited"
          message={notificationsQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(notificationsQuery.error)}
          action={<button type="button">Retry notifications feed</button>}
        />
      ) : null}
      {notificationsQuery.isError && !isRateLimitedError(notificationsQuery.error) ? (
        <StateError
          title="Notifications failed to load"
          message="Could not load notifications."
          detail={getErrorMessage(notificationsQuery.error, "Request failed")}
          action={<button type="button">Retry notifications feed</button>}
        />
      ) : null}
      {notificationsQuery.data && notificationsQuery.data.length === 0 ? (
        <StateEmpty message="No notifications yet." />
      ) : null}
      {notificationsQuery.data && notificationsQuery.data.length > 0 ? (
        <ul>
          {notificationsQuery.data.map((notification) => (
            <li key={notification.id}>{notification.event_type}</li>
          ))}
        </ul>
      ) : null}
      <PageActions>
        <button type="button">Mark selected as read</button>
      </PageActions>
    </Page>
  );
}
