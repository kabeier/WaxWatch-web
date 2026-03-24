import { useMeQuery, useUnreadNotificationCountQuery } from "@/lib/query/hooks";
import { isRateLimitedError } from "@/lib/query/state";

import type { TopNavUtilityItem, SideNavStatus } from "./primitives";

function getAccountStatusLabel(args: { isActive?: boolean; hasError: boolean }) {
  if (args.hasError) {
    return "Unavailable";
  }

  if (args.isActive === true) {
    return "Active";
  }

  if (args.isActive === false) {
    return "Attention";
  }

  return "Loading";
}

function getInboxValue(args: { unreadCount?: number; isLoading: boolean; hasError: boolean }) {
  if (args.isLoading) {
    return "…";
  }

  if (args.hasError) {
    return "—";
  }

  return `${args.unreadCount ?? 0}`;
}

function getSessionValue(args: {
  displayName?: string | null;
  email?: string | null;
  isLoading: boolean;
  hasError: boolean;
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

  if (args.hasError) {
    return "Profile unavailable";
  }

  return "Profile unavailable";
}

function getSessionMeta(args: {
  isActive?: boolean;
  unreadCount?: number;
  hasUnreadData: boolean;
  unreadError: unknown;
}) {
  const activityLabel = args.unreadError
    ? isRateLimitedError(args.unreadError)
      ? "Notifications cooling down"
      : "Notifications unavailable"
    : args.hasUnreadData
      ? `${args.unreadCount ?? 0} unread notification${args.unreadCount === 1 ? "" : "s"}`
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

  const utilities: TopNavUtilityItem[] = [
    {
      href: "/notifications",
      label: "Inbox",
      value: getInboxValue({
        unreadCount: unreadCountQuery.data?.unread_count,
        isLoading: unreadCountQuery.isLoading,
        hasError: unreadCountQuery.isError,
      }),
    },
    {
      href: "/settings/profile",
      label: "Account",
      value: getAccountStatusLabel({
        isActive: meQuery.data?.is_active,
        hasError: meQuery.isError,
      }),
    },
  ];

  const sideNavStatus: SideNavStatus = {
    label: "Session",
    value: getSessionValue({
      displayName: meQuery.data?.display_name,
      email: meQuery.data?.email,
      isLoading: meQuery.isLoading,
      hasError: meQuery.isError,
    }),
    meta: getSessionMeta({
      isActive: meQuery.data?.is_active,
      unreadCount: unreadCountQuery.data?.unread_count,
      hasUnreadData: typeof unreadCountQuery.data?.unread_count === "number",
      unreadError: unreadCountQuery.error,
    }),
  };

  return {
    utilities,
    sideNavStatus,
  };
}
