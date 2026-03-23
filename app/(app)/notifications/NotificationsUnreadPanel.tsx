"use client";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { StateError, StateLoading, StateRateLimited } from "@/components/ui/primitives/state";
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function NotificationsUnreadPanel() {
  const notificationsQuery = useNotificationsQuery();
  const unreadCountQuery = useUnreadNotificationCountQuery();
  const notifications = Array.isArray(notificationsQuery.data) ? notificationsQuery.data : [];
  const firstUnreadNotificationId = notifications.find((notification) => !notification.is_read)?.id;
  const markReadMutation = useMarkNotificationReadMutation(firstUnreadNotificationId ?? "");

  return (
    <>
      {unreadCountQuery.isLoading ? (
        <StateLoading message="Loading unread notification count…" />
      ) : null}
      {unreadCountQuery.isError && isRateLimitedError(unreadCountQuery.error) ? (
        <StateRateLimited
          title="Unread count is temporarily rate limited"
          message="Unread count is cooling down. Retry unlocks when the cooldown ends."
          detail={unreadCountQuery.error.message}
          retryAfterSeconds={getRetryAfterSeconds(unreadCountQuery.error)}
          action={
            <RetryAction
              label="Retry unread count"
              retryAfterSeconds={getRetryAfterSeconds(unreadCountQuery.error)}
              onRetry={() => void unreadCountQuery.retry()}
            />
          }
        />
      ) : null}
      {unreadCountQuery.isError && !isRateLimitedError(unreadCountQuery.error) ? (
        <StateError
          title="Unread count failed to load"
          message="Could not load unread notification count."
          detail={getErrorMessage(unreadCountQuery.error, "Request failed")}
        />
      ) : null}
      {unreadCountQuery.isError ? (
        <p role="status" aria-live="polite">
          Status: Unread notifications count is currently unavailable.
        </p>
      ) : null}
      {!unreadCountQuery.isLoading && !unreadCountQuery.isError ? (
        <div className={pageViewStyles.callout}>
          {unreadCountQuery.data?.unread_count ?? 0} unread items are waiting for review.
        </div>
      ) : null}
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
    </>
  );
}
