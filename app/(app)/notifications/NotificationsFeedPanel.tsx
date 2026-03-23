"use client";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { formatDateTime } from "@/components/page-view/format";
import { ListContainer, ListRow } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import { useNotificationsQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

export default function NotificationsFeedPanel() {
  const notificationsQuery = useNotificationsQuery();
  const notifications = Array.isArray(notificationsQuery.data) ? notificationsQuery.data : [];

  return (
    <>
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
      {notificationsQuery.data && notifications.length === 0 ? (
        <StateEmpty message="No notifications yet." />
      ) : null}
      {notificationsQuery.data && notifications.length > 0 ? (
        <ListContainer>
          {notifications.map((notification) => (
            <ListRow
              key={notification.id}
              title={notification.event_type}
              description={`${notification.channel} · ${notification.status}`}
              trailing={
                <span className={pageViewStyles.mutedText}>
                  {notification.is_read ? "Read" : "Unread"}
                </span>
              }
            >
              <div className={pageViewStyles.inlineGroup}>
                <span className={pageViewStyles.mutedText}>
                  Created {formatDateTime(notification.created_at)}
                </span>
                <span className={pageViewStyles.mutedText}>
                  {notification.read_at
                    ? `Read ${formatDateTime(notification.read_at)}`
                    : "Pending review"}
                </span>
              </div>
            </ListRow>
          ))}
        </ListContainer>
      ) : null}
    </>
  );
}
