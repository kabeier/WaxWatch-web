import { useMeQuery, useUnreadNotificationCountQuery } from "@/lib/query/hooks";
import { isRateLimitedError } from "@/lib/query/state";

import type { TopNavUtilityItem, SideNavStatus } from "./primitives";

function getAccountStatusLabel(args: {
  isActive?: boolean;
  isLoading: boolean;
  hasError: boolean;
  hasSettled: boolean;
}) {
  if (args.hasError) {
    return "Unavailable";
  }

  if (args.isLoading || !args.hasSettled) {
    return "Loading";
  }

  if (args.isActive === true) {
    return "Active";
  }

  if (args.isActive === false) {
    return "Attention";
  }

  return "Unavailable";
}

function getInboxValue(args: {
  unreadCount?: number;
  isLoading: boolean;
  hasError: boolean;
  hasSettled: boolean;
}) {
  if (args.isLoading || !args.hasSettled) {
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
  hasSettled: boolean;
}) {
  const normalizedDisplayName = args.displayName?.trim();
  const normalizedEmail = args.email?.trim();

  if (normalizedDisplayName) {
    return normalizedDisplayName;
  }

  if (normalizedEmail) {
    return normalizedEmail;
  }

  if (args.hasError) {
    return "Profile unavailable";
  }

  if (args.isLoading || !args.hasSettled) {
    return "Loading profile";
  }

  return "Profile unavailable";
}

function getSessionMeta(args: {
  isActive?: boolean;
  unreadCount?: number;
  unreadIsLoading: boolean;
  unreadHasError: boolean;
  unreadError: unknown;
  unreadHasSettled: boolean;
}) {
  const activityLabel = args.unreadHasError
    ? isRateLimitedError(args.unreadError)
      ? "Notifications cooling down"
      : "Notifications unavailable"
    : args.unreadIsLoading || !args.unreadHasSettled
      ? "Notifications syncing"
      : typeof args.unreadCount === "number"
        ? `${args.unreadCount ?? 0} unread notification${args.unreadCount === 1 ? "" : "s"}`
        : "Notifications unavailable";

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

  const meFetchedFlag = (meQuery as { isFetched?: boolean }).isFetched;
  const unreadFetchedFlag = (unreadCountQuery as { isFetched?: boolean }).isFetched;

  const meHasSettled =
    typeof meFetchedFlag === "boolean" ? meFetchedFlag : Boolean(meQuery.data) || meQuery.isError;
  const unreadHasSettled =
    typeof unreadFetchedFlag === "boolean"
      ? unreadFetchedFlag
      : Boolean(unreadCountQuery.data) || unreadCountQuery.isError;

  const utilities: TopNavUtilityItem[] = [
    {
      href: "/notifications",
      label: "Inbox",
      value: getInboxValue({
        unreadCount: unreadCountQuery.data?.unread_count,
        isLoading: unreadCountQuery.isLoading,
        hasError: unreadCountQuery.isError,
        hasSettled: unreadHasSettled,
      }),
    },
    {
      href: "/settings/profile",
      label: "Account",
      value: getAccountStatusLabel({
        isActive: meQuery.data?.is_active,
        isLoading: meQuery.isLoading,
        hasError: meQuery.isError,
        hasSettled: meHasSettled,
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
      hasSettled: meHasSettled,
    }),
    meta: getSessionMeta({
      isActive: meQuery.data?.is_active,
      unreadCount: unreadCountQuery.data?.unread_count,
      unreadIsLoading: unreadCountQuery.isLoading,
      unreadHasError: unreadCountQuery.isError,
      unreadError: unreadCountQuery.error,
      unreadHasSettled: unreadHasSettled,
    }),
  };

  return {
    utilities,
    sideNavStatus,
  };
}
