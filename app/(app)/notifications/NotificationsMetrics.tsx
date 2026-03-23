"use client";

import pageViewStyles from "@/components/page-view/PageView.module.css";
import { useNotificationsQuery, useUnreadNotificationCountQuery } from "@/lib/query/hooks";

type NotificationsMetric = "unreadCount" | "loadedCount" | "loadedUnreadCount";

const metricContent: Record<
  NotificationsMetric,
  {
    label: string;
    value: (args: {
      unreadCount: number;
      loadedCount: number;
      loadedUnreadCount: number;
    }) => string | number;
  }
> = {
  unreadCount: {
    label: "Unread notifications",
    value: ({ unreadCount }) => unreadCount,
  },
  loadedCount: {
    label: "Loaded activity items",
    value: ({ loadedCount }) => loadedCount,
  },
  loadedUnreadCount: {
    label: "Unread in current list",
    value: ({ loadedUnreadCount }) => loadedUnreadCount,
  },
};

export default function NotificationsMetrics({ metric }: { metric: NotificationsMetric }) {
  const notificationsQuery = useNotificationsQuery();
  const unreadCountQuery = useUnreadNotificationCountQuery();
  const notifications = Array.isArray(notificationsQuery.data) ? notificationsQuery.data : [];
  const content = metricContent[metric];

  return (
    <>
      <div className={pageViewStyles.metricValue}>
        {content.value({
          unreadCount: unreadCountQuery.data?.unread_count ?? 0,
          loadedCount: notifications.length,
          loadedUnreadCount: notifications.filter((notification) => !notification.is_read).length,
        })}
      </div>
      <div className={pageViewStyles.metricLabel}>{content.label}</div>
    </>
  );
}
