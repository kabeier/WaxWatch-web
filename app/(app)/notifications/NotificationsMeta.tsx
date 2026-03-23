"use client";

import { useUnreadNotificationCountQuery } from "@/lib/query/hooks";

export default function NotificationsMeta() {
  const unreadCountQuery = useUnreadNotificationCountQuery();

  return (
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
  );
}
