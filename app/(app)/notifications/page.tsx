"use client";

import { RetryAction } from "@/components/RetryAction";
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  ListContainer,
  ListRow,
  PageTab,
  PageTabs,
} from "@/components/ui/primitives/base";
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
import {
  ActiveDivider,
  PageCardGroup,
  PageView,
  pageViewStyles,
} from "@/components/page-view/PageView";
import { formatDateTime } from "@/components/page-view/format";

export default function NotificationsPage() {
  const viewModel = routeViewModels.notifications;
  const notificationsQuery = useNotificationsQuery();
  const unreadCountQuery = useUnreadNotificationCountQuery();
  const notifications = Array.isArray(notificationsQuery.data) ? notificationsQuery.data : [];
  const firstUnreadNotificationId = notifications.find((notification) => !notification.is_read)?.id;
  const markReadMutation = useMarkNotificationReadMutation(firstUnreadNotificationId ?? "");

  return (
    <PageView
      title={viewModel.heading}
      description={viewModel.summary}
      eyebrow="Inbox"
      actions={
        <Button
          disabled={markReadMutation.isPending || !firstUnreadNotificationId}
          onClick={() => {
            if (firstUnreadNotificationId) {
              markReadMutation.mutate(undefined);
            }
          }}
        >
          {markReadMutation.isPending ? "Marking as read…" : "Mark first unread as read"}
        </Button>
      }
      tabs={
        <PageTabs label="Notifications sections">
          <PageTab active>Unread snapshot</PageTab>
          <PageTab disabled>All activity</PageTab>
        </PageTabs>
      }
      meta={
        <>
          <span>
            Unread count and feed history stay separated into cards so the list remains the dominant
            surface.
          </span>
          <span>
            {unreadCountQuery.isLoading
              ? "Unread count loading"
              : unreadCountQuery.isError
                ? "Unread count unavailable"
                : `${unreadCountQuery.data?.unread_count ?? 0} unread`}
          </span>
        </>
      }
    >
      <PageCardGroup columns="three">
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>
              {unreadCountQuery.data?.unread_count ?? 0}
            </div>
            <div className={pageViewStyles.metricLabel}>Unread notifications</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>{notifications.length}</div>
            <div className={pageViewStyles.metricLabel}>Loaded activity items</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={pageViewStyles.metricStack}>
            <div className={pageViewStyles.metricValue}>
              {notifications.filter((notification) => !notification.is_read).length}
            </div>
            <div className={pageViewStyles.metricLabel}>Unread in current list</div>
          </CardBody>
        </Card>
      </PageCardGroup>

      <ActiveDivider />

      <PageCardGroup columns="sidebar">
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Unread status</CardTitle>
            <CardDescription>
              Keep unread summary actions above the feed without turning the entire page into a
              status stack.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
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
            {markReadMutation.data ? (
              <p role="status">Success: Notification marked as read.</p>
            ) : null}
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
          </CardBody>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle>Notification feed</CardTitle>
            <CardDescription>
              Use a vertical list with the newest events at the top and clear read-state treatment.
            </CardDescription>
          </CardHeader>
          <CardBody className={pageViewStyles.cardStack}>
            {notificationsQuery.isLoading ? (
              <StateLoading message="Loading notifications…" />
            ) : null}
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
          </CardBody>
        </Card>
      </PageCardGroup>
    </PageView>
  );
}
