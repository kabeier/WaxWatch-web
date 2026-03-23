"use client";

import { Button } from "@/components/ui/primitives/base";
import { useMarkNotificationReadMutation, useNotificationsQuery } from "@/lib/query/hooks";

export default function NotificationsHeaderAction() {
  const notificationsQuery = useNotificationsQuery();
  const notifications = Array.isArray(notificationsQuery.data) ? notificationsQuery.data : [];
  const firstUnreadNotificationId = notifications.find((notification) => !notification.is_read)?.id;
  const markReadMutation = useMarkNotificationReadMutation(firstUnreadNotificationId ?? "");

  return (
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
  );
}
