"use client";

import { RetryAction } from "@/components/RetryAction";
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
      <p role="status" aria-live="polite">
        Status: Unread notifications: {unreadCountQuery.data?.unread_count ?? 0}.
      </p>

      {notificationsQuery.isLoading ? <StateLoading message="Loading notifications…" /> : null}
      {notificationsQuery.isError && isRateLimitedError(notificationsQuery.error) ? (
        <StateRateLimited
          title="Notifications are temporarily rate limited"
          message="The feed is cooling down. Retry unlocks when the cooldown ends."
          detail={notificationsQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(notificationsQuery.error)}
          action={
            <RetryAction
              label="Retry notifications feed"
              retryAfterSeconds={getRetryAfterSeconds(notificationsQuery.error)}
              onRetry={() => void notificationsQuery.retry()}
            />
          }
        />
      ) : null}
      {notificationsQuery.isError && !isRateLimitedError(notificationsQuery.error) ? (
        <StateError
          title="Notifications failed to load"
          message="Could not load notifications."
          detail={getErrorMessage(notificationsQuery.error, "Request failed")}
          action={
            <RetryAction
              label="Retry notifications feed"
              onRetry={() => void notificationsQuery.retry()}
            />
          }
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
      <button
        type="button"
        disabled={markReadMutation.isPending || !firstUnreadNotificationId}
        onClick={() => {
          if (firstUnreadNotificationId) {
            markReadMutation.mutate(undefined);
          }
        }}
      >
        {markReadMutation.isPending ? "Marking as read…" : "Mark first unread as read"}
      </button>

      {markReadMutation.data ? <p role="status">Success: Notification marked as read.</p> : null}
      {markReadMutation.isError && isRateLimitedError(markReadMutation.error) ? (
        <StateRateLimited
          message="Mark-as-read is temporarily rate limited."
          detail={markReadMutation.error.message}
          retryAfterSeconds={getRetryAfterSeconds(markReadMutation.error)}
        />
      ) : null}
      {markReadMutation.isError && !isRateLimitedError(markReadMutation.error) ? (
        <StateError
          message="Could not mark notification as read."
          detail={getErrorMessage(markReadMutation.error, "Request failed")}
        />
      ) : null}
    </section>
  );
}
