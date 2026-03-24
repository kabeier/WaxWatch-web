"use client";

import { useMemo } from "react";

import { RetryAction } from "@/components/RetryAction";
import pageViewStyles from "@/components/page-view/PageView.module.css";
import { formatDateTime } from "@/components/page-view/format";
import { ListContainer, ListMeta, ListRow, ListText } from "@/components/ui/primitives/base";
import {
  StateEmpty,
  StateError,
  StateLoading,
  StateRateLimited,
} from "@/components/ui/primitives/state";
import type { Notification } from "@/lib/api/domains/types";
import { useNotificationsQuery } from "@/lib/query/hooks";
import { getErrorMessage, getRetryAfterSeconds, isRateLimitedError } from "@/lib/query/state";

const EMPTY_NOTIFICATIONS: Notification[] = [];

function toTimestamp(value?: string) {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function sortByNewest<
  TItem extends { id?: string | number; created_at?: string; updated_at?: string },
>(items: TItem[]) {
  return [...items].sort((left, right) => {
    const timestampDiff =
      toTimestamp(right.updated_at ?? right.created_at) -
      toTimestamp(left.updated_at ?? left.created_at);
    if (timestampDiff !== 0) {
      return timestampDiff;
    }

    return String(left.id ?? "").localeCompare(String(right.id ?? ""));
  });
}

export default function NotificationsFeedPanel() {
  const notificationsQuery = useNotificationsQuery();
  const notifications = useMemo(
    () => (Array.isArray(notificationsQuery.data) ? notificationsQuery.data : EMPTY_NOTIFICATIONS),
    [notificationsQuery.data],
  );
  const sortedNotifications = useMemo(() => sortByNewest(notifications), [notifications]);
  const isLoadingInitial = notificationsQuery.isLoading && notifications.length === 0;

  return (
    <>
      {isLoadingInitial ? <StateLoading message="Loading notifications…" /> : null}
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
      {notifications.length > 0 ? (
        <ListContainer dense>
          {sortedNotifications.map((notification) => (
            <ListRow
              key={notification.id}
              title={<ListText>{notification.event_type}</ListText>}
              description={
                <ListText>
                  {notification.channel} · {notification.status}
                </ListText>
              }
              trailing={
                <ListText className={pageViewStyles.mutedText}>
                  {notification.is_read ? "Read" : "Unread"}
                </ListText>
              }
            >
              <ListMeta>
                <ListText className={pageViewStyles.mutedText}>
                  Created {formatDateTime(notification.created_at)}
                </ListText>
                <ListText className={pageViewStyles.mutedText}>
                  {notification.read_at
                    ? `Read ${formatDateTime(notification.read_at)}`
                    : "Pending review"}
                </ListText>
              </ListMeta>
            </ListRow>
          ))}
        </ListContainer>
      ) : null}
    </>
  );
}
