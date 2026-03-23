import { useMemo } from "react";

import { useMeQuery, useUnreadNotificationCountQuery } from "@/lib/query/hooks";

import type { TopNavUtilityItem, SideNavStatus } from "./primitives";

function getAccountStatusLabel(isActive?: boolean) {
  if (isActive === true) {
    return "Active";
  }

  if (isActive === false) {
    return "Attention";
  }

  return "Loading";
}

function getSessionValue(args: {
  displayName?: string | null;
  email?: string | null;
  isLoading: boolean;
}) {
  if (args.displayName) {
    return args.displayName;
  }

  if (args.email) {
    return args.email;
  }

  if (args.isLoading) {
    return "Loading profile";
  }

  return "Profile unavailable";
}

function getSessionMeta(args: { isActive?: boolean; unreadCount: number; hasUnreadData: boolean }) {
  const activityLabel = args.hasUnreadData
    ? `${args.unreadCount} unread notification${args.unreadCount === 1 ? "" : "s"}`
    : "Notifications syncing";

  if (args.isActive === true) {
    return `Account active · ${activityLabel}`;
  }

  if (args.isActive === false) {
    return `Account needs attention · ${activityLabel}`;
  }

  return activityLabel;
}

export function useAppShellChromeData() {
  const meQuery = useMeQuery();
  const unreadCountQuery = useUnreadNotificationCountQuery();

  const utilities = useMemo<TopNavUtilityItem[]>(() => {
    const unreadCount = unreadCountQuery.data?.unread_count;

    return [
      {
        href: "/notifications",
        label: "Inbox",
        value: unreadCountQuery.isLoading ? "…" : `${unreadCount ?? 0}`,
      },
      {
        href: "/settings/profile",
        label: "Account",
        value: getAccountStatusLabel(meQuery.data?.is_active),
      },
    ];
  }, [meQuery.data?.is_active, unreadCountQuery.data?.unread_count, unreadCountQuery.isLoading]);

  const sideNavStatus = useMemo<SideNavStatus>(
    () => ({
      label: "Session",
      value: getSessionValue({
        displayName: meQuery.data?.display_name,
        email: meQuery.data?.email,
        isLoading: meQuery.isLoading,
      }),
      meta: getSessionMeta({
        isActive: meQuery.data?.is_active,
        unreadCount: unreadCountQuery.data?.unread_count ?? 0,
        hasUnreadData: typeof unreadCountQuery.data?.unread_count === "number",
      }),
    }),
    [
      meQuery.data?.display_name,
      meQuery.data?.email,
      meQuery.data?.is_active,
      meQuery.isLoading,
      unreadCountQuery.data?.unread_count,
    ],
  );

  return {
    utilities,
    sideNavStatus,
  };
}
