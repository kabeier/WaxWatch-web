"use client";

import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";
import { routeViewModels } from "@/lib/view-models/routes";

export default function NotificationsPage() {
  const viewModel = routeViewModels.notifications;
  const notificationsQuery = useNotificationsQuery();
  const unreadCountQuery = useUnreadNotificationCountQuery();
  const firstUnreadNotificationId = notificationsQuery.data?.find(
    (notification) => !notification.is_read,
  )?.id;
  const markReadMutation = useMarkNotificationReadMutation(firstUnreadNotificationId ?? "");

  return (
    <section>
      <h1>{viewModel.heading}</h1>
      <p>{viewModel.summary}</p>

      {unreadCountQuery.isLoading ? <StateLoading message="Loading unread count…" /> : null}
      {unreadCountQuery.isError && isRateLimitedError(unreadCountQuery.error) ? (
        <StateRateLimited
          title="Unread-count requests are cooling down"
          message="Unread notification count is temporarily rate-limited."
          retryAfterSeconds={getRetryAfterSeconds(unreadCountQuery.error)}
          action={
            <button type="button" onClick={() => unreadCountQuery.refetch()}>
              Retry unread count
            </button>
          }
        />
      ) : null}
      {unreadCountQuery.isError && !isRateLimitedError(unreadCountQuery.error) ? (
        <StateError
          title="Unread count failed"
          message="Could not load unread notification count."
          detail={getErrorMessage(unreadCountQuery.error, "Request failed")}
          action={
            <button type="button" onClick={() => unreadCountQuery.refetch()}>
              Retry unread count
            </button>
          }
        />
      ) : null}
      <p>Unread notifications: {unreadCountQuery.data?.unread_count ?? 0}</p>

      {notificationsQuery.isLoading ? <StateLoading message="Loading notifications…" /> : null}
      {notificationsQuery.isError && isRateLimitedError(notificationsQuery.error) ? (
        <StateRateLimited
          title="Notifications are temporarily rate limited"
          message="Notifications feed requests are cooling down."
          detail="Wait for cooldown then retry loading notifications."
          retryAfterSeconds={getRetryAfterSeconds(notificationsQuery.error)}
          action={
            <button type="button" onClick={() => notificationsQuery.refetch()}>
              Retry notifications feed
            </button>
          }
        />
      ) : null}
      {notificationsQuery.isError && !isRateLimitedError(notificationsQuery.error) ? (
        <StateError
          title="Notifications failed to load"
          message="Could not load notifications."
          detail={getErrorMessage(notificationsQuery.error, "Request failed")}
          action={
            <button type="button" onClick={() => notificationsQuery.refetch()}>
              Retry notifications feed
            </button>
          }
        />
      ) : null}
      {notificationsQuery.data && notificationsQuery.data.length === 0 ? (
        <StateEmpty
          title="No notifications yet"
          message="You are all caught up. New alert events will appear here."
        />
      ) : null}
      {notificationsQuery.data && notificationsQuery.data.length > 0 ? (
        <ul>
          {notificationsQuery.data.map((notification) => (
            <li key={notification.id}>{notification.event_type}</li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        disabled={markReadMutation.isPending || !firstUnreadNotificationId}
        onClick={() => {
          if (!firstUnreadNotificationId) {
            return;
          }

          markReadMutation.mutate(undefined);
        }}
      >
        {markReadMutation.isPending ? "Marking as read…" : "Mark first unread as read"}
      </button>

      {markReadMutation.data ? <p>Marked one notification as read.</p> : null}
      {markReadMutation.isError && isRateLimitedError(markReadMutation.error) ? (
        <StateRateLimited
          title="Mark-as-read is rate-limited"
          message="Please wait before marking another notification as read."
          retryAfterSeconds={getRetryAfterSeconds(markReadMutation.error)}
          action={
            <button
              type="button"
              disabled={markReadMutation.isPending || !firstUnreadNotificationId}
              onClick={() => markReadMutation.mutate(undefined)}
            >
              Retry mark as read
            </button>
          }
        />
      ) : null}
      {markReadMutation.isError && !isRateLimitedError(markReadMutation.error) ? (
        <StateError
          title="Mark-as-read failed"
          message="Could not mark notification as read."
          detail={getErrorMessage(markReadMutation.error, "Request failed")}
          action={
            <button
              type="button"
              disabled={markReadMutation.isPending || !firstUnreadNotificationId}
              onClick={() => markReadMutation.mutate(undefined)}
            >
              Retry mark as read
            </button>
          }
        />
      ) : null}
    </section>
  );
}
